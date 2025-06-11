import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  deleteDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { showToast } from "../../script.js";

let wishlishtedProducts = [];

export function loadUserWishlistItems() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    let wishlistContainer = document.getElementById("wishlistContainer");

    try {
      let wishSnapshot = await getDocs(
        collection(db, "users", user.uid, "wishlist")
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

      wishlistContainer.innerHTML = "";

      wishSnapshot.forEach((doc) => {
        let product = doc.data();
        let productId = doc.id;
        wishlishtedProducts.push(product);

        let div = document.createElement("div");

        // div.innerHTML += `
        //   <div class="cart-item-image">
        //     <p class="card-orderStatus">${product.orderStatus}</p>
        //     <img 
        //       src="${product.displayImage}" 
        //       alt="${product.name}" 
        //     />
        //   </div>
        //   <div class="order-item-content">
        //     <p class="card-sellerName">${product.sellerName}</p>
        //     <p class="card-title">${product.name}</p>
        //     <p class="order-price">Total Price: <span>₹${
        //       product.price * product.quantity
        //     }</span></p>
        //     <p class="card-quantity">Quantity: ${product.quantity}</p>
        //     <p class="card-orderDate">
        //       Order Date: ${new Date(product.timestamp).toLocaleString()}
        //     </p>
        //     <button onclick="cancelOrder('${productId}')" class="btn btn-danger btn-sm mt-3">
        //       Cancel Order
        //     </button>
        //   </div>
        // `;
        wishlistContainer.appendChild(div);
      });
    } catch (error) {
      return;
    }
  });
}
