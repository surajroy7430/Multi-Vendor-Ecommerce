import { db } from "../firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  generateStarIcons,
  getSelectedQuantity,
  isLoggedIn,
  isUserAllowed,
  setupQuantityControls,
  showToast,
} from "../script.js";
import { currentUser, currentWishlist, wishlistReady } from "../authState.js";
import {
  handleAddToCartWithSize,
  handleAddToWishlist,
} from "../User/Script/cartAndWishlist.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  const encodedId = params.get("ref");
  let msg = document.getElementById("invalidMsg");

  if (encodedId) {
    try {
      const originalId = atob(encodedId);

      let docRef = doc(db, "clothes", originalId);
      let docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const product = docSnap.data();

        await renderProductDetails(product, originalId);
        loadImages();
        setupCartAndWishlist(product, originalId);
        buyNow(product, originalId);
        checkPincode();
      } else {
        msg.textContent = "No such product found.";
        msg.style.color = "red";
      }
    } catch (error) {
      console.warn("Invalid Product");
    }
  } else {
    msg.textContent = "No product ref provided in URL.";
    msg.style.color = "red";
  }
});

async function renderProductDetails(
  {
    name: productName,
    brand,
    images,
    color,
    gender,
    description,
    price,
    totalPrice,
    ratings,
    reviews,
    sellerTag,
    size,
    subCategory,
  },
  originalId
) {
  await wishlistReady;

  document.title = brand + " - " + productName;

  let subcategory =
    subCategory.charAt(0).toUpperCase() + subCategory.slice(1).toLowerCase();

  document.querySelector(".breadcrumb").innerHTML = `
    <li class="breadcrumb-item"><a href="/index.html">Home</a></li>
    <li class="breadcrumb-item"><a href="/Products/${gender.toLowerCase()}s.html">${gender} Clothing</a></li>
    <li class="breadcrumb-item">${subcategory}</li>
    <li class="breadcrumb-item active breadcrumb-name" aria-current="page">${productName}</li>
  `;

  let div = document.getElementById("product-details");
  div.innerHTML = `
    <div class="container-1 flex gap-4">
      <div class="p-image-container w-[50%] h-full flex gap-3">
        <!-- Thumbnails -->
        <div
          class="images-array flex flex-col items-center gap-3 p-2 overflow-y-auto max-h-[450px]"
          style="scrollbar-width: none;"
        >
          ${images
            .map(
              (img, i) =>
                `<div class="single-image cursor-pointer">
              <img
                src="${img}"
                alt="${`Image_${i + 1}`}"
                data-index="${i}"
                loading="lazy"
                width="70"
                height="95"
                class="thumbnail object-cover border border-gray-300"
              />
            </div>`
            )
            .join(" ")}
        </div>
        <!-- Main Display Image -->
        <div class="w-full h-auto">
          <img 
            id="displayImage" 
            src="${images[0]}" 
            alt="${productName}" 
            class="h-auto object-contain" 
          />
        </div>
      </div>

      <div
        class="product-info text-left w-[40%] overflow-y-auto"
        style="scrollbar-width: none"
      >
        <div class="flex flex-col gap-2.5 mb-2">
          <div>
            <a>
              <span class="font-semibold text-lg">${brand}</span>
            </a>
            <p class="text-sm text-slate-400">${productName}</p>
          </div>

          <div class="flex flex-col gap-0.5">
            <div class="flex items-baseline gap-2">
              <h2 class="font-semibold text-xl">₹${price}</h2>
              <span class="text-slate-500 text-lg line-through"
                >₹${totalPrice}</span
              >
              <span class="text-emerald-500 text-lg">${Math.round(
                ((totalPrice - price) / totalPrice) * 100
              )}% OFF</span>
            </div>
            <p class="text-slate-400 text-xs">inclusive of all taxes</p>
          </div>

          <div class="flex flex-col">
            <span class="text-slate-500">Ratings</span>
            <span class="text-xl">
            ${generateStarIcons(ratings?.toFixed(1))}</span>
          </div>
          <div
            class="bg-green-600 text-white py-[4px] px-[8px] font-semibold text-xs uppercase opacity-80 w-fit"
          >
            ${sellerTag}
          </div>

          <div>
            <div class="flex items-center justify-start gap-1.5">
              <span class="text-slate-500">Color: </span>
              <span class="text-outline font-semibold">
                ${color}
              </span>
            </div>
          </div>
        </div>

        <div class="sizes-container py-[16px] flex flex-col gap-[8px]">
          <div class="flex justify-between items-center">
            <div class="text-slate-500">Available Sizes</div>
            <button
              class="text-sm text-blue-400 font-semibold uppercase"
            >
              Size Guide
            </button>
          </div>
          <ul class="flex gap-1.5 flex-wrap px-1">
            ${sortedSizeDisplay(size, originalId)}
          </ul>
        </div>

        <div class="afterAuthBtns py-[12px] flex flex-col gap-[12px]">
          <div class="quantities flex flex-col gap-0.5">
              <div class="text-slate-500">Quantity</div>
              <div class="quantity-selection flex">
              <button class="decrease-qty" type="button">
                <i class="bi bi-dash-lg"></i>
              </button>
              <div class="quantity-display pointer-events-none" data-qty="1">1</div>
              <button class="increase-qty" type="button">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
          </div>
          <div class="flex h-[3rem] gap-2">
            <button
              class="cartBtn h-full w-full bg-amber-400 text-white font-semibold rounded-md flex items-center justify-center gap-[8px] hover:bg-amber-500"
            >
              <span class="text-lg"><i class="bi bi-cart3"></i></span>
              <span>Add To Cart</span>
            </button>
            <button
              class="wishlistBtn h-full w-full bg-transparent text-gray-500 border border-gray-600 font-semibold rounded-md flex items-center justify-center gap-[8px] hover:border-gray-800"
              >
              <span class="text-lg wishlist-icon"></span>
              <span class="wishlist-text"></span>
            </button>
          </div>
        </div>

        <div class="delivery-details flex flex-col gap-[7px] py-[16px]">
          <div class="flex items-center gap-2 text-xl">
            <i class="bi bi-geo-alt"></i>
            <span>Check for Delivery Details</span>
          </div>
          <div
            class="border border-gray-600 rounded w-[99%] flex items-center gap-2 mx-[1px] px-[16px] py-[13px] focus-within:ring-1 focus-within:ring-sky-500"
          >
            <input
              type="text"
              name="pincode"
              id="pincodeInput"
              placeholder="Enter Pincode"
              min="1"
              maxlength="6"
              autoComplete="off"
              class="text-slate-600 outline-none text-sm flex-grow-1 h-full"
            />
            <button
              id="pincodeCheckBtn"
              class="text-blue-500 text-sm uppercase font-semibold"
            >
              Check
            </button>
          </div>
          
          <div id="pincodeError" class="flex flex-col gap-2 mt-0.5 mx-0.5 hidden">
            <div class="pincode-error text-red-500 text-sm">
              Not a valid pincode
            </div>
          </div>
          
          <div id="pincodeCity" class="flex flex-col gap-2 mt-0.5 mx-0.5 hidden">
            <div
              id="cityText"
              class="pincode-error text-emerald-400 text-sm font-semibold"
            ></div>
          </div>
          
          <div id="deliveryDetails" class="flex flex-col gap-2 mt-0.5 mx-0.5 hidden">
            <div class="flex items-center gap-3">
              <div class="text-3xl"><i class="bi bi-truck"></i></div>
              <div class="flex flex-col flex-1">
                <p class="text-green-600 text-lg" id="deliveryDate">
                  Expected delivery by Day, Date Month
                </p>
                <span class="text-sm text-slate-500"
                  >Final delivery based on items in bag</span
                >
              </div>
            </div>
            <div class="flex gap-3 items-center">
              <div class="text-3xl"><i class="bi bi-cash"></i></div>
              <div class="text-slate-500 text-lg">
                Cash on Delivery is available
              </div>
            </div>
          </div>
        </div>

        <div class="flex h-[3rem] gap-2">
          <div class="afterAuthBuyBtn h-full w-full cursor-pointer">
            <button
              class="h-full w-full bg-amber-500 px-2 text-white font-semibold rounded-md flex items-center justify-center gap-[8px] hover:bg-amber-600"
            >
              <span class="text-lg"><i class="bi bi-lightning-fill"></i></span>
              <span>Buy Now</span>
            </button>
          </div>

          <button
            class="h-full w-full bg-emerald-500 px-2 text-white font-semibold rounded-md flex items-center justify-center gap-[8px] hover:bg-emerald-600"
          >
            <span class="text-lg"><i class="bi bi-chat-right-text-fill"></i></span>
            <span>Chat Seller</span>
          </button>
        </div>
      </div>
    </div>

    <div class="container-2 w-full flex gap-5 mt-3">
      <div class="description-container w-[50%] flex flex-col gap-2">
        <button
          class="description-btn flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-lg font-semibold ring-1 ring-slate-400 text-slate-500"
        >
          <div class="flex items-center gap-2">
            <div><i class="bi bi-card-text"></i></div>
            <div>Product Description</div>
          </div>
          <div>
            <i class="bi bi-plus-lg"></i>
          </div>
        </button>
        <div class="text-justify text-sm px-4">
          ${description}
        </div>
      </div>
      <div class="review-container w-[50%] flex flex-col gap-2">
        <button
          class="show-reviews-button flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-lg font-semibold ring-1 ring-slate-400 text-slate-500"
        >
          <div class="flex items-center gap-2">
            <div><i class="bi bi-star"></i></div>
            <div>Reviews</div>
          </div>
          <div>
            <i class="bi bi-plus-lg"></i>
          </div>
        </button>
        <div class="reviews text-sm px-4 w-full flex gap-2">
          <div class="w-[50%]">${ratingDisplay(reviews)}</div>

          <div class="w-[50%] flex flex-col items-center justify-center gap-1">
            <div class="text-3xl">${ratings.toFixed(1)}</div>
            <div class="text-slate-400 text-base">${
              reviews?.length
            } ratings</div>
            <button class="text-xl text-sky-500">RATE</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setupQuantityControls(div.querySelector(".quantities"));
}

function loadImages(direction = "left") {
  let mainImage = document.getElementById("displayImage");
  let thumbnails = document.querySelectorAll(".thumbnail");
  let activeThumbnail = null;

  const animationClass =
    direction === "bottom" ? "image-fade-bt" : "image-fade-lr";

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      if (mainImage.src !== thumb.src) {
        mainImage.src = thumb.src;

        // Trigger animation
        mainImage.classList.remove("image-fade-lr", "image-fade-bt"); // clear previous
        void mainImage.offsetWidth; // trigger reflow
        mainImage.classList.add(animationClass);
      }

      if (activeThumbnail && activeThumbnail !== thumb) {
        activeThumbnail.classList.remove("ring-2", "ring-amber-500");
      }

      thumb.classList.add("ring-2", "ring-amber-500");

      activeThumbnail = thumb;
    });

    if (index === 0) {
      thumb.classList.add("ring-2", "ring-amber-500");
      activeThumbnail = thumb;
    }
  });
}

function sortedSizeDisplay(size, productId) {
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const sizeList = sizeOrder.map((s) => {
    let isAvailable = size?.includes(s);
    return `
      <li class="sizes ${
        !isAvailable ? "disabled" : "font-semibold"
      } h-[50px] w-[50px] flex items-center justify-center rounded 
      ">
        <label class="size-radio-label cursor-pointer">
          <input name="${productId}" value="${s}" type="radio" class="hidden">
          <span class="name h-[50px] w-[50px] flex items-center justify-center border border-gray-500 rounded">${s}</span>
        </label>
      </li>
    `;
  });

  return sizeList.join(" ");
}

function ratingDisplay(reviews) {
  let groupedRatings = reviews?.reduce((acc, rev) => {
    acc[rev.ratings] = (acc[rev.ratings] || 0) + 1;
    return acc;
  }, {});

  let getColor = (rate) => {
    switch (rate) {
      case 5:
        return "bg-green-500";
      case 4:
        return "bg-lime-400";
      case 3:
        return "bg-amber-400";
      case 2:
        return "bg-orange-400";
      case 1:
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  let rating = [5, 4, 3, 2, 1].map((rate) => {
    let count = groupedRatings?.[rate] || 0;
    return `
        <div class="flex items-center gap-2 my-2">
          <div class="flex gap-[2px]">
            <div class="text-sm font-semibold">${rate}</div>
            <div class="text-yellow-400">
              <i class="bi bi-star-fill"></i>
            </div>
          </div>
          <div class="flex mx-2">
            ${[1, 2, 3, 4, 5]
              .map(
                (i) => `
                <div class="w-10 h-1 ${
                  count >= i ? getColor(rate) : "bg-gray-300"
                }"></div>
              `
              )
              .join(" ")}
          </div>
          <em class="text-sm text-gray-500">(${count})</em>
        </div>
      `;
  });

  return rating.join(" ");
}

function updateWishlistButton(productId) {
  let icon = document.querySelector(".wishlist-icon");
  let text = document.querySelector(".wishlist-text");

  let isWished = currentWishlist.has(productId);
  icon.innerHTML = isWished
    ? `<i class="bi bi-heart-fill text-red-500"></i>`
    : `<i class="bi bi-heart-fill"></i>`;
  text.textContent = isWished ? "Wishlisted" : "Wishlist";
}

function setupCartAndWishlist(product, productId) {
  let cartBtn = document.querySelector(".cartBtn");
  let wishlistBtn = document.querySelector(".wishlistBtn");

  cartBtn?.addEventListener("click", () => {
    handleAddToCartWithSize({ ...product, id: productId });
  });

  wishlistBtn?.addEventListener("click", () => {
    handleAddToWishlist({ ...product, id: productId }, () => {
      updateWishlistButton(productId);
    });
  });

  updateWishlistButton(productId);
}

function buyNow(product, productId) {
  let btn = document.querySelector(".afterAuthBuyBtn button");

  btn?.addEventListener("click", async () => {
    if (!isLoggedIn(currentUser)) return;

    if (!(await isUserAllowed("buy products", currentUser))) return;

    let selectedSize = document.querySelector(
      `input[name="${productId}"]:checked`
    )?.value;

    if (!selectedSize) {
      showToast("Please select a size before proceeding.", true);
      return;
    }

    let quantity = getSelectedQuantity();

    let orderRef = doc(
      db,
      "users",
      currentUser.uid,
      "orders",
      `${product.id}_${selectedSize}_${Date.now()}`
    );

    let orderData = {
      ...product,
      size: selectedSize,
      quantity,
      status: "pending",
      orderTime: new Date().toISOString(),
    };

    try {
      await setDoc(orderRef, orderData);

      localStorage.setItem("currentOrder", JSON.stringify(orderData));

      window.location.href = "/User/Checkout/checkout.html";
    } catch (error) {
      showToast("Order failed: " + error.message, true);
    }
  });
}

function checkPincode() {
  document
    .getElementById("pincodeCheckBtn")
    ?.addEventListener("click", async () => {
      let pinInput = document.getElementById("pincodeInput");
      let pincode = pinInput.value.trim();

      let errorBox = document.getElementById("pincodeError");
      let cityBox = document.getElementById("pincodeCity");
      let deliveryBox = document.getElementById("deliveryDetails");

      let cityText = document.getElementById("cityText");
      let deliveryDate = document.getElementById("deliveryDate");

      errorBox.classList.add("hidden");
      cityBox.classList.add("hidden");
      deliveryBox.classList.add("hidden");

      if (!pincode) return;

      if (!/^\d{6}$/.test(pincode)) {
        errorBox.classList.remove("hidden");
        return;
      }

      try {
        let res = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`
        );
        let data = await res.json();

        // console.log("pin", data);

        if (data[0].Status === "Success") {
          let postOffice = data[0].PostOffice[0];
          let district = postOffice.District;
          let state = postOffice.State;

          cityText.textContent = `${district}, ${state} - ${pincode}`;
          cityBox.classList.remove("hidden");

          let today = new Date();
          // let days = Math.floor(Math.random() * 3) + 4;
          today.setDate(today.getDate() + 5);

          let deliveryStr = today.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

          deliveryDate.textContent = `Expected delivery by ${deliveryStr}`;
          deliveryBox.classList.remove("hidden");

          pinInput.value = "";
        } else {
          errorBox.classList.remove("hidden");
        }
      } catch (error) {
        console.error("Pincode failed, ", error.message);
        errorBox.classList.remove("hidden");
      }
    });
}
