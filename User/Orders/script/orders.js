import { auth, db } from "../../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  updateDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { showToast } from "../../../script.js";

let orderedProducts = [];

export function loadUserOrderItems() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const orderLength = document.getElementById("order-length");
    const orderContainer = document.getElementById("orderContainer");

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

      orderLength.textContent = `(${orderSnapshot.size})`;
      orderContainer.innerHTML = "";

      const parentDiv = document.createElement("div");
      parentDiv.className =
        "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

      orderSnapshot.forEach((doc) => {
        let product = doc.data();
        let productId = doc.id;
        let ref = btoa(productId);
        orderedProducts.push(product);

        let statusColor = "bg-amber-300";
        let actionBtn = "";

        if (product.orderStatus === "cancelled") {
          statusColor = "bg-red-300";
        } else if (product.orderStatus === "delivered") {
          statusColor = "bg-green-300";
          actionBtn = `
            <button class="flex items-center justify-center gap-1 text-sky-500 w-full px-2 py-1 border font-[550] text-sm">
              <i class="bi bi-star-fill"></i> Rate
            </button>
          `;
        } else if (product.orderStatus === "pending") {
          statusColor = "bg-amber-300";
          actionBtn = `
            <a href="/User/Orders/Order-Details.html?ref=${ref}" class="flex items-center justify-center gap-1 text-sky-500 w-full px-2 py-1 border font-[550] text-sm">
              <i class="bi bi-pin-map-fill"></i> Track
            </a>
            <button onclick="cancelOrder('${productId}')" class="w-full border px-3 py-1 text-sm font-[550] text-red-600">
              Cancel
            </button>
          `;
        }

        const div = document.createElement("div");
        div.className = "border rounded";

        div.innerHTML += `
          <div class="relative">
            <p class="absolute top-0 left-0 py-1 px-2 text-xs ${statusColor}">
              ${product.orderStatus}
            </p>
            <img 
              src="${product.displayImage}" 
              alt="${product.name}"
            />
          </div>
          <div class="font-medium text-left">
            <div class="p-2 text-sm">
              <h3 class="font-semibold">${product.brand}</h3>
              <p class="truncate text-gray-500 m-0">${product.name}</p>
              <p class="m-0 text-gray-500">Price: ₹${
                product.price * product.quantity
              }</p>
              <p class="m-0 text-gray-500">Size: ${product.size}</p>
            </div>
            
            <div class="flex items-center justify-between">
              ${actionBtn}
            </div>
          </div>
        `;
        parentDiv.appendChild(div);
        orderContainer.appendChild(parentDiv);
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

      await updateDoc(orderRef, {
        orderStatus: "cancelled",
        cancelledAt: new Date(),
      });

      orderedProducts = orderedProducts.map((p) =>
        p.id === productId ? { ...p, orderStatus: "cancelled" } : p
      );

      showToast("Order cancelled.");
      loadUserOrderItems();
    } catch (error) {
      showToast("Error canceling order. Please try again.", true);
    }
  });
};
