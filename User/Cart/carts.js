import { db } from "../../firebase-config.js";
import {
  doc,
  deleteDoc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { showToast } from "../../script.js";
import { currentUser } from "../../authState.js";
import { productCard } from "../Wishlist/wishlists.js";

let cartProducts = [];
let deliveryFee = 0;
let timestamp = Date.now();

export async function loadUserCartItems() {
  if (!currentUser) return;

  let cartItems = document.getElementById("cart-products");
  let cartLength = document.getElementById("cart-length");
  let cartContainer = document.getElementById("cart-summary");

  let orderNowBtn = document.getElementById("orderNowBtn");

  try {
    let cartSnapshot = await getDocs(
      collection(db, "users", currentUser.uid, "cart")
    );

    let cartSize = cartSnapshot.size;
    cartLength.innerHTML = `(${cartSize} item${cartSize === 1 ? "" : "s"})`;

    // Empty Cart
    if (cartSnapshot.empty) {
      cartContainer.innerHTML = `
          <div class="mx-auto my-10">
            <img 
              src="https://i.ibb.co/XrPgD1Xk/empty-cart.png" 
              alt="empty-bag"
              width="170px"
            >
            <p class="font-[550] my-2">Nothing in the bag</p>
            <a href="/Products/mens.html" class="text-sky-500">Continue Shopping</a>
          </div>
        `;
      cartContainer.style.display = "flex";
      return;
    }

    let totalMRP = 0;
    let subTotal = 0;
    let productsHTML = "";

    cartSnapshot.forEach((doc) => {
      let product = doc.data();
      let productId = doc.id;
      cartProducts.push(product);

      let ref = btoa(product.id);

      const itemSubTotal = product.price * product.quantity;
      const itemTotalMRP = product.totalPrice * product.quantity;
      const discount = Math.round(
        ((itemTotalMRP - itemSubTotal) / itemTotalMRP) * 100
      );

      subTotal += itemSubTotal;
      totalMRP += itemTotalMRP;

      let today = new Date();
      today.setDate(today.getDate() + 5);

      let deliveryStr = today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      productsHTML += `
        <div class="cart-items h-[200px] flex gap-2 p-3 border rounded-md">
          <div class="w-[20%]">
            <a href="/Product-Details/p.html?ref=${ref}">
              <img 
                src="${product.displayImage}" 
                alt="${product.name}" 
                class="rounded-sm h-full object-cover aspect-4/5" 
              />
            </a>
          </div>
          <div class="text-left text-sm flex flex-col justify-between gap-1 w-[80%]">
            <p class="font-semibold hover:text-sky-600">
              <a href="/Product-Details/p.html?ref=${ref}">${product.name}</a>
            </p>
            <p class="text-slate-500 font-[500]">Seller: ${product.sellerName}</p>
            <p class="flex gap-1 items-baseline">
              <span class="text-lg font-semibold">
                ₹${itemSubTotal}
              </span>
              <span class=" line-through opacity-50">
                ₹${itemTotalMRP}
              </span>
              <span class="text-lime-600 font-semibold text-right">
                ${discount}% Off
              </span>
            </p>
            <p class="text-xs text-sky-600 font-semibold flex gap-2">
              <span class="bg-[#f4f8fb] px-2 py-1 rounded-sm">Size : ${product.size}</span>
              <button class="bg-[#f4f8fb] px-2 py-1 rounded-sm flex items-center gap-1">
                Qty : ${product.quantity}
                <span><i class="bi bi-chevron-down"></i></span>
              </button>
            </p>
            <div class="mt-3 flex justify-between">
              <div class="font-semibold uppercase">
                <button onclick="" class="mr-2 uppercase hover:text-green-700">
                  Save for Later
                </button>
                <button onclick="removeFromCart('${productId}')" class="uppercase hover:text-red-500">
                  Remove
                </button>
              </div>
              <p class="text-xs">
                <i class="bi bi-check-circle-fill text-lime-600"></i>
                Delivery by 
                <span class="font-semibold">${deliveryStr}</span>
              </p>
            </div>
          </div>
        </div>
      `;
    });

    if (subTotal < 500) {
      deliveryFee = 40;
      subTotal += deliveryFee;
    }

    const savings = totalMRP - subTotal;

    cartItems.innerHTML = productsHTML;
    cartContainer.style.display = "flex";

    document.getElementById("cart-save").innerText = `₹${savings}`;
    document.getElementById("totalAmount").innerText = `₹${subTotal}`;
    document.getElementById(
      "totalMRPText"
    ).innerText = `Total MRP (${cartSize} item${cartSize > 1 ? "s" : ""})`;
    document.getElementById("totalMRP").innerText = `₹${totalMRP}`;
    document.getElementById(
      "discountPrice"
    ).innerHTML = `<i class="bi bi-dash-lg"></i>₹${savings}`;
    document.getElementById("delivery-fee").innerText =
      deliveryFee > 0 ? `₹${deliveryFee}` : "Free";

    await loadAddress(currentUser);

    if (orderNowBtn) {
      orderNowBtn.onclick = () =>
        orderAllProducts(cartProducts, currentUser.uid);
    }
  } catch (error) {
    return;
  }
}

window.removeFromCart = async function (productId) {
  if (!currentUser) return;

  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "cart", productId));

    cartProducts = cartProducts.filter((p) => p.id === productId);

    loadUserCartItems();
  } catch (error) {
    showToast("Error removing item. Please try again.", true);
  }
};

export function watchCartBadge(uid) {
  let desktopCartBadge = document.getElementById("cart-badge");
  let MobileCartBadge = document.getElementById("mobile-cart-badge");

  if (!desktopCartBadge) return;
  if (!MobileCartBadge) return;

  onSnapshot(collection(db, "users", uid, "cart"), (snapshot) => {
    let currentItemIds = new Set();
    snapshot.forEach((doc) => {
      currentItemIds.add(doc.id);
    });

    let count = currentItemIds.size;

    if (count > 0) {
      desktopCartBadge.classList.remove("d-none");
      MobileCartBadge.classList.remove("d-none");

      desktopCartBadge.textContent = count;
      MobileCartBadge.textContent = count;
    } else {
      desktopCartBadge.classList.add("d-none");
      MobileCartBadge.classList.add("d-none");
    }
  });
}

window.orderAllProducts = async function (products, uid) {
  try {
    let batch = writeBatch(db);
    let ordersRef = collection(db, "users", uid, "orders");
    let cartRef = collection(db, "users", uid, "cart");

    for (let product of products) {
      const orderRef = doc(ordersRef);
      const randomNumber = Math.floor(10000000 + Math.random() * 90000000);

      batch.set(orderRef, {
        ...product,
        orderId: `ORDER${randomNumber}`,
        timestamp,
        deliveryFee: deliveryFee === 0 ? "Free" : deliveryFee,
        orderStatus: "pending",
      });

      const cartSnapshot = await getDocs(cartRef);
      cartSnapshot.forEach((docSnap) => {
        batch.delete(doc(cartRef, docSnap.id));
      });
    }

    await batch.commit();

    showToast("Product Ordered Successfully!");
    window.location.href = "/User/Orders/My-Orders.html";
  } catch (error) {
    showToast("error ordering product", true);
  }
};

// populate address
const addressContainer = document.querySelector(".address-container");

async function loadAddress(currentUser) {
  const addressref = collection(db, "users", currentUser.uid, "addresses");
  const snap = await getDocs(addressref);

  if (snap.empty) {
    addressContainer.innerHTML = `
      <div class="text-sky-500 font-semibold">
        <a href="/User/Dashboard.html">
          <i class="bi bi-plus-lg"></i> Add Address
        </a>
      </div>
    `;
  } else {
    const address = snap.docs[0].data();

    const fullAddress = [
      address.address,
      address.area,
      address.landmark || "",
      address.city,
      address.state,
    ]
      .filter(Boolean)
      .join(", ");

    addressContainer.innerHTML = `
      <div class="text-sm">
        <div class="flex gap-1">
          <span>Deliver to:</span>
          <span class="font-semibold">
            <span>${address.name},</span>
            <span>${address.pincode}</span>
          </span>
          <span
            class="ring-1 ring-orange-400 rounded-sm text-orange-400 bg-orange-100 ml-1 p-[2px] font-semibold text-xs"
            >${address.type}</span
          >
        </div>
        <div class="truncate block w-full">${fullAddress}</div>
      </div>
      <button class="text-xs text-sky-500 font-[550]">Change</button>
    `;
  }
}

let wishlishtedProducts = [];

export async function loadWishlistItems() {
  if (!currentUser) return;

  const wishlistContainer = document.getElementById("wishlisted-products");

  try {
    let wishSnapshot = await getDocs(
      collection(db, "users", currentUser.uid, "wishlist")
    );

    wishlistContainer.innerHTML = `<h2 class="text-lg font-semibold text-left mb-4">My Wishlist</h2>`;

    if (wishSnapshot.empty) {
      wishlistContainer.innerHTML = "";
      return;
    }
    const parentDiv = document.createElement("div");
    parentDiv.className =
      "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

    wishSnapshot.forEach((pDoc) => {
      let product = pDoc.data();
      let productId = pDoc.id;
      wishlishtedProducts.push(product);

      const card = productCard(product, productId, {
        removeHandler: async (id) => {
          await deleteDoc(doc(db, "users", currentUser.uid, "wishlist", id));
          loadWishlistItems();
          loadUserCartItems();
        },
        addToCartHandler: async (id) => {
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

            await setDoc(
              doc(db, "users", currentUser.uid, "cart", id),
              cartItem
            );
            await deleteDoc(itemRef);

            showToast("Product Added to Cart");
            loadWishlistItems();
            loadUserCartItems();
          }
        },
      });

      parentDiv.appendChild(card);
      wishlistContainer.appendChild(parentDiv);
    });
  } catch (error) {
    console.log(error);
  }
}
