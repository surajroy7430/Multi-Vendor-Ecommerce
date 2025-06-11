import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { showToast } from "../../script.js";

let orderedProducts = [];

export function loadUserOrderItems() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    let orderContainer = document.getElementById("orderContainer");

    try {
      let orderSnapshot = await getDocs(
        collection(db, "users", user.uid, "orders")
      );

      if (orderSnapshot.empty) {
        orderContainer.innerHTML = `
          <div class="flex flex-col gap-2 items-center my-10">
            <img 
              src="https://i.ibb.co/dJ1K7RBH/empty-orders.png" 
              alt="no-orders"
              width="170px"
            >
            <p class="font-[550]">No orders placed yet!</p>
            <a href="/Products/mens.html" class="text-sky-500">Continue Shopping</a>
          </div>
        `;
        return;
      }

      orderContainer.innerHTML = "";

      orderSnapshot.forEach((doc) => {
        let product = doc.data();
        let productId = doc.id;
        orderedProducts.push(product);

        let div = document.createElement("div");
        div.className = "order-items";

        div.innerHTML += `
          <div class="cart-item-image">
            <p class="card-orderStatus">${product.orderStatus}</p>
            <img 
              src="${product.displayImage}" 
              alt="${product.name}" 
            />
          </div>
          <div class="order-item-content">
            <p class="card-sellerName">${product.sellerName}</p>
            <p class="card-title">${product.name}</p>
            <p class="order-price">Total Price: <span>₹${
              product.price * product.quantity
            }</span></p>
            <p class="card-quantity">Quantity: ${product.quantity}</p>
            <p class="card-orderDate">
              Order Date: ${new Date(product.timestamp).toLocaleString()}
            </p>
            <button onclick="cancelOrder('${productId}')" class="btn btn-danger btn-sm mt-3">
              Cancel Order
            </button>
          </div>
        `;
        orderContainer.appendChild(div);
      });
    } catch (error) {
      return;
    }
  });
}

window.cancelOrder = async function (productId) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
      const orderRef = doc(db, "users", user.uid, "orders", productId);
      // await deleteDoc(orderRef);

      await updateDoc(orderRef, {
        orderStatus: 'cancelled',
        cancelledAt: new Date(),
      })

      // orderedProducts = orderedProducts.filter((p) => p.id === productId); // delete
      orderedProducts = orderedProducts.map((p) => p.id === productId ? { ...p, orderStatus: 'cancelled'} : p);

      showToast("Order cancelled.");
      loadUserOrderItems();
    } catch (error) {
      showToast("Error canceling order. Please try again.", true);
    }
  });
};
