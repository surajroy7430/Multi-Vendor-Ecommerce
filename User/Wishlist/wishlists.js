import { db } from "../../firebase-config.js";
import {
  doc,
  deleteDoc,
  collection,
  getDoc,
  getDocs,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { showToast } from "../../script.js";
import { currentUser } from "../../authState.js";

let wishlishtedProducts = [];

export async function loadUserWishlistItems() {
  if (!currentUser) return;

  const wishLength = document.getElementById("wishlist-length");
  const wishlistContainer = document.getElementById("wishlistContainer");

  try {
    let wishSnapshot = await getDocs(
      collection(db, "users", currentUser.uid, "wishlist")
    );

    if (wishSnapshot.empty) {
      wishlistContainer.innerHTML = `
          <div class="flex flex-col gap-2 items-center my-10">
            <img 
              src="https://i.ibb.co/R4PT19bQ/wishlist-Empty.png" 
              alt="empty-wishlist"
              width="170px"
            >
            <p class="font-[550]">Hey! Your wishlist is empty.</p>
            <a href="/Products/mens.html" class="text-sky-500">Continue Shopping</a>
          </div>
        `;
      return;
    }

    wishLength.textContent = `(${wishSnapshot.size})`;
    wishlistContainer.innerHTML = "";

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
          loadUserWishlistItems();
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
            loadUserWishlistItems();
          }
        },
      });

      parentDiv.appendChild(card);
      wishlistContainer.appendChild(parentDiv);
    });
  } catch (error) {
    return;
  }
}

export function productCard(product, productId, options = {}) {
  const { removeHandler = () => {}, addToCartHandler = () => {} } = options;

  const div = document.createElement("div");
  div.className = "border rounded";

  div.innerHTML += `
    <div class="relative">
      <p class="absolute top-0 left-0 py-1 px-2 bg-zinc-800 text-xs text-white">
        ${product.sellerTag}
      </p>
      <img 
        src="${product.displayImage}" 
        alt="${product.name}"
      />
      <p class="absolute bottom-2 left-3 py-1 px-2 bg-zinc-200 font-semibold text-xs rounded-full">
        <i class="bi bi-star-fill text-yellow-400"></i>
        ${product.ratings.toFixed(1)}
      </p>
    </div>
    <div class="font-medium text-left">
      <div class="p-2 text-sm">
        <h3 class="font-semibold">${product.brand}</h3>
        <p class="truncate text-gray-500 m-0">${product.name}</p>
        <p class="m-0 text-gray-500">Price: ₹${product.price}</p>
      </div>
      
      <div class="flex items-center justify-between">
        <button data-id="${productId}" class="remove-from-wishlist border font-bold px-3 py-1">
          <i class="bi bi-trash3"></i>
        </button>
        <button data-id="${productId}" class="add-to-cart border font-semibold py-1 w-full">
          Add to Cart
        </button>
      </div>
    </div>
  `;

  div.querySelector(".remove-from-wishlist").addEventListener("click", () => {
    removeHandler(productId);
  });

  div.querySelector(".add-to-cart").addEventListener("click", () => {
    addToCartHandler(productId);
  });

  return div;
}
