import { auth, db } from "../../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  deleteDoc,
  updateDoc,
  collection,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { showToast } from "../../../script.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  const encodedId = params.get("ref");
  let msg = document.getElementById("invalidMsg");

  if (encodedId) {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const originalId = atob(encodedId);

        let docRef = doc(db, "users", user.uid, "orders", originalId);
        let orderSnap = await getDoc(docRef);

        if (orderSnap.exists()) {
          const product = orderSnap.data();

          await renderOrderDetails(product, originalId);
        } else {
          msg.textContent = "No such product found.";
          msg.style.color = "red";
        }
      } catch (error) {
        console.warn("Invalid Product");
      }
    });
  } else {
    msg.textContent = "No product ref provided in URL.";
    msg.style.color = "red";
  }
});

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  const options = {
    day: "2-digit",
    month: "sort",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  const formatedTime = `${String(hours).padStart(2, "0")}:${minutes} ${suffix}`;

  return `${day} ${month} ${year}, ${formatedTime}`;
}

async function renderOrderDetails(
  {
    id: productId,
    name: productName,
    brand,
    displayImage,
    color,
    gender,
    description,
    deliveryFee,
    price,
    orderStatus,
    orderId,
    totalPrice,
    ratings,
    size,
    sellerName,
    cancelledAt,
    quantity,
    timestamp,
  },
  originalId
) {
  const ref = btoa(productId);

  document.querySelector(".breadcrumb").innerHTML = `
    <li class="breadcrumb-item">
      <a href="/User/Orders/My-Orders.html">My Orders</a>
    </li>
    <li class="breadcrumb-item active breadcrumb-name" aria-current="page">${orderId}</li>
  `;

  const totalAmount =
    price*quantity + (typeof deliveryFee === "number" ? deliveryFee : 0);

  let div = document.getElementById("order-details");
  div.innerHTML = `
    <section class="flex flex-col basis-[60%] w-[60%] gap-3">
      <div class="border rounded-lg p-4 w-full">
        <a href="/Product-Details/p.html?ref=${ref}">
          <div class="flex gap-4 h-[150px] w-full">
            <img
              src="${displayImage}"
              alt="${productName}"
              class="rounded-sm h-full object-cover aspect-4/5"
            />
            <div class="flex flex-col text-left gap-1">
              <h3 class="font-semibold ">${brand}</h3>
              <p class="m-0 text-zinc-600">${productName}</p>
              <p class="m-0 text-zinc-600 text-xs">${size}, ${color}</p>
              <p class="m-0 text-zinc-600 text-xs">Seller: ${sellerName}</p>
              <p class="m-0 font-semibold">₹${price}</p>
            </div>
          </div>
        </a>
      </div>

      <div class="border rounded-lg p-4 w-full">
        <div class="w-full text-left flex flex-col gap-1 justify-between">
          <div>
            <h2 class="text-lg font-semibold">Order Placed</h2>
            <p>${formatTimestamp(timestamp)}</p>
            <p>Order Status: <span class="capitalize">${orderStatus}</span></p>
          </div>

          <hr class="my-2"></hr>

          <div class="my-3">
            progress bar
          </div>

          <button 
            class="ring-1 ring-red-200 text-red-500 font-semibold w-full p-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>

    <section class="flex flex-col basis-[40%] w-[40%] gap-3">
      <div class="border rounded-lg p-4 w-full">
        <div class="w-full text-left">
          <h3 class="font-semibold">Shipping Details</h3>
          <hr class="mt-2 mb-3"></hr>
          
          <div class="text-sm relative">
            <div class="absolute top-0 right-0 ring-1 ring-amber-300 text-amber-500 px-1 py-0.5 rounded-sm">
              {type}
            </div>
            <h4 class="font-semibold mb-2">{user.name} | 1234567890</h4>
            <p>{address}</p>
          </div>
        </div>
      </div>

      <div class="border rounded-lg p-4 w-full">
        <div class="w-full text-left">
          <h3 class="font-semibold">Price Breakup</h3>
          <hr class="mt-2 mb-3"></hr>

          <div>
            <div class="text-zinc-500 font-medium">
              <p class="flex justify-between mb-2">Cart Total <span>₹${price*quantity}</span></p>
              <p class="flex justify-between mb-2">Delivery Fee <span>${deliveryFee}</span></p>
              <p class="flex justify-between mb-2">Delivery Type <span>COD | Card</span></p>
            </div>

            <h4 class="flex justify-between mt-3 font-[550]">Total Price <span>₹${totalAmount}</span></h4>
          </div>
        </div>
      </div>
    </section>
  `;
}
