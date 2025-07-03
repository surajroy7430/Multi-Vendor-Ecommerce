import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      loadUserOrders();
      loadUserWishlist();
    } else {
      console.warn("User not signed in.");
    }
  });
});

async function loadUserOrders() {
  if (!currentUser) return;

  const orderLength = document.getElementById("order-length");
  const orderContainer = document.getElementById("ordered-products");

  orderContainer.innerHTML = "";

  const orderRef = collection(db, "users", currentUser.uid, "orders");
  const orderSnap = await getDocs(orderRef);

  if (orderSnap.empty) {
    document.getElementById("my-orders").innerHTML = `
      <div class="flex flex-col items-center justify-center gap-2 h-[70vh]">
        <p class="font-[550]">No orders placed!</p>
        <a 
          href="/Products/mens.html" 
          class="p-2 bg-sky-500 uppercase font-semibold rounded-md text-white">
          Start Shopping
        </a>
      </div>
    `;
    return;
  }

  orderLength.textContent = `(${orderSnap.size})`;

  orderSnap.forEach((docSnap) => {
    const data = docSnap.data();

    let statusColor = "text-amber-500 ring-amber-500 bg-amber-50";
    let actionBtn = "";

    if (data.orderStatus === "cancelled") {
      statusColor = "text-red-500 ring-red-500 bg-red-50";
    } else if (data.orderStatus === "delivered") {
      statusColor = "text-green-500 ring-green-500 bg-green-50";
      actionBtn = `
        <button class="flex items-center gap-1 text-sky-500 ring-1 px-2 py-1 rounded-sm font-[550] text-sm">
          <i class="bi bi-star-fill"></i> Rate
        </button>
      `;
    } else if (data.orderStatus === "pending") {
      statusColor = "text-amber-500 ring-amber-500 bg-amber-50";
      actionBtn = `
        <button class="flex items-center gap-1 text-sky-500 ring-1 px-2 py-1 rounded-sm font-[550] text-sm">
          <i class="bi bi-pin-map-fill"></i> Track
        </button>
      `;
    }

    const item = document.createElement("div");
    item.className = "border rounded-md p-3 flex gap-4 cursor-default";

    item.innerHTML = `
      <img
        src="${data.displayImage}"
        alt="${data.name}"
        class="h-[120px] rounded-sm object-cover"
      />
      <div class="flex gap-2 justify-between w-full">
        <div class="flex flex-col gap-2">
          <h3 class="truncate font-[550]">${data.name}</h3>
          <div class="font-semibold">₹${data.price}</div>
          <div
            class="flex gap-2 text-xs text-gray-400 font-[550]"
          >
            <p>Color: <span>${data.color}</span></p>
            <p>Size: <span>${data.size}</span></p>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <p class="${statusColor} ring-1 p-1 rounded-sm font-[550] uppercase text-sm">${data.orderStatus}</p>
          ${actionBtn}
        </div>
      </div>
    `;

    orderContainer.appendChild(item);
  });
}

async function loadUserWishlist() {
  if (!currentUser) return;

  const wishlistLength = document.getElementById("wishlist-length");
  const wishlistContainer = document.getElementById("wishlist-products");

  wishlistContainer.innerHTML = "";

  const wishlistRef = collection(db, "users", currentUser.uid, "wishlist");
  const wishlistSnap = await getDocs(wishlistRef);

  if (wishlistSnap.empty) {
    document.getElementById("my-wishlist").innerHTML = `
      <div
        class="flex flex-col items-center justify-center gap-2 h-[70vh]"
      >
        <p class="font-[550]">No items wishlisted yet!</p>
        <a 
          href="/Products/mens.html" 
          class="p-2 bg-sky-500 uppercase font-semibold rounded-md text-white">
          Start Shopping
        </a>
      </div>
    `;
    return;
  }

  wishlistLength.textContent = `(${wishlistSnap.size})`;

  wishlistSnap.forEach((docSnap) => {
    const data = docSnap.data();

    let ref = btoa(data.id);

    const item = document.createElement("div");
    item.className = "border rounded-md p-3 flex gap-4 cursor-default";

    item.innerHTML = `
      <a href="/Product-Details/p.html?ref=${ref}" target="_blank">
        <img
          src="${data.displayImage}"
          alt="${data.name}"
          class="h-[120px] rounded-sm object-cover cursor-pointer"
        />
      </a>
      <div class="flex gap-2 justify-between w-full">
        <div class="flex flex-col gap-1 justify-between">
          <h3 class="truncate font-[550] cursor-pointer hover:text-sky-500">
            <a href="/Product-Details/p.html?ref=${ref}" target="_blank">
              ${data.name}
            </a>
          </h3>
          <p class="text-gray-400 font-[550] text-xs">Color: ${data.color}</p>
          <div class="font-[550] flex gap-1 items-baseline">
            <span class="text-lg">₹${data.price}</span>
            <span class="line-through opacity-50">₹${data.totalPrice}</span>
            <span class="text-lime-600">${Math.round(
              ((data.totalPrice - data.price) / data.totalPrice) * 100
            )}% Off</span>
          </div>
          <div class="flex gap-2">
            <button
              data-id="${data.id}"
              class="add-to-cart w-[30px] h-[30px] border rounded-sm text-gray-500 p-2 flex items-center justify-center text-xl hover:bg-gray-100"
            >
              <i class="bi bi-cart-plus-fill"></i>
            </button>
            <button
              data-id="${data.id}"
              class="remove-from-wishlist w-[30px] h-[30px] border rounded-sm text-gray-500 p-2 flex items-center justify-center text-xl hover:bg-gray-100"
            >
              <i class="bi bi-trash3-fill"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    wishlistContainer.appendChild(item);
  });

  setupWishlistBtn();
}

function setupWishlistBtn() {
  document.querySelectorAll(".remove-from-wishlist").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;

      await deleteDoc(doc(db, "users", currentUser.uid, "wishlist", id));

      loadUserWishlist();
    });
  });

  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;

      const itemRef = doc(db, "users", currentUser.uid, "wishlist", id);
      const itemSnap = await getDoc(itemRef);

      if (itemSnap.exists()) {
        const itemData = itemSnap.data();

        const cartItem = {
          ...itemData,
          quantity: 1,
          size: Array.isArray(itemData.size)
            ? itemData.size[0]
            : itemData.size || "Free Size",
        };

        await setDoc(doc(db, "users", currentUser.uid, "cart", id), cartItem);
        await deleteDoc(itemRef);

        loadUserWishlist();
      }
    });
  });
}
