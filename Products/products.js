import { db } from "../firebase-config.js";
import {
  getDocs,
  collection,
  query,
  where,
  limit,
  startAfter,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { generateStarIcons, setupQuantityControls } from "../script.js";
import { currentWishlist, wishlistReady } from "../authState.js";
import {
  handleAddToCart,
  handleAddToWishlist,
} from "../User/Script/cartAndWishlist.js";

let pageSize = 50;
let productData = [];
let lastVisible = null;
let isLoading = false;
let debouncedTimer;
let searchResults = [];
let searchLastVisible = null;
let isSearching = false;
let isSearchComplete = false;
let filteredData = [];
let isFiltering = false;

document.addEventListener("DOMContentLoaded", async () => {
  let gender = document.body.dataset.gender;
  let productLength = document.getElementById("product-length");

  if (!gender) {
    console.error("Gender not defined on <body> tag.");
    return;
  }

  let q = query(collection(db, "clothes"), where("gender", "==", gender));
  let snapshot = await getDocs(q);
  let totalLength = snapshot.size;

  if (!productLength) return;

  productLength.innerHTML = "";
  productLength.innerHTML = `
    <h1 class="text-2xl font-semibold">${gender}'s Clothing</h1>
    <span class="text-[1rem] text-slate-500" id="total-length">${totalLength} Products</span>
  `;

  getProductsFirstPage(gender);

  let loadBtn = document.getElementById("load-more");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      if (isSearching) {
        if (!isSearchComplete) {
          renderPaginatedResults(gender);
        }
        return;
      }

      if (isFiltering) return;

      if (!isLoading) {
        getProductsNextPage(gender);
      }
    });
  }

  let observer = new MutationObserver(() => {
    let searchInput = document.querySelectorAll("#search-input");
    if (searchInput.length > 0) {
      attachEventListeners(gender);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  let sortSelect = document.getElementById("price-sort");
  sortSelect.addEventListener("change", applyFilters);
});

function attachEventListeners(gender) {
  let searchInput = document.querySelectorAll("#search-input");

  searchInput.forEach((input) => {
    input.addEventListener("input", (e) => {
      clearTimeout(debouncedTimer);

      debouncedTimer = setTimeout(() => {
        let searchQuery = e.target.value.trim().toLowerCase();
        if (searchQuery === "") {
          isSearching = false;
          isSearchComplete = false;
          isFiltering = false;
          productData.length = 0;
          getProductsFirstPage(gender);
        } else {
          handleProductSearch(searchQuery, gender);
        }
      }, 500);
    });
  });

  document.getElementById("price-sort").addEventListener("change", () => {
    let sortType = document.getElementById("price-sort").value;

    if (isSearching) {
      searchResults = sortProducts(searchResults, sortType);
      safeRenderProducts(searchResults);
    } else if (isFiltering) {
      filteredData = sortProducts(filteredData, sortType);
      safeRenderProducts(filteredData);
    } else {
      productData = sortProducts(productData, sortType);
      safeRenderProducts(productData);
    }
  });
}

async function getProductsFirstPage(gender) {
  let q = query(
    collection(db, "clothes"),
    where("gender", "==", gender),
    orderBy("timestamp", "desc"),
    limit(pageSize)
  );

  let snapshot = await getDocs(q);

  let msg = document.getElementById("productListMsg");
  let loadBtn = document.getElementById("load-more");

  msg.innerHTML = "";
  loadBtn.disabled = true;

  if (snapshot.empty) {
    msg.textContent = "No products found.";
    msg.style.color = "red";
    return;
  }
  productData.length = 0;
  snapshot.forEach((doc) => {
    let product = doc.data();
    product.timestamp = product.timestamp?.toDate?.() || Date.now(0);
    productData.push({ id: doc.id, ...product });
  });

  lastVisible = snapshot.docs[snapshot.docs.length - 1];
  safeRenderProducts(productData);
  loadBtn.disabled = false;
  isLoading = false;
}

async function getProductsNextPage(gender) {
  if (!lastVisible || isLoading) return;

  isLoading = true;
  let loadBtn = document.getElementById("load-more");
  let msg = document.getElementById("productListMsg");
  loadBtn.disabled = true;

  let q = query(
    collection(db, "clothes"),
    where("gender", "==", gender),
    orderBy("timestamp", "desc"),
    startAfter(lastVisible),
    limit(pageSize)
  );

  let snapshot = await getDocs(q);

  if (!snapshot.empty) {
    snapshot.forEach((doc) => {
      let product = doc.data();
      product.timestamp = product.timestamp?.toDate?.() || Date.now(0);
      productData.push({ id: doc.id, ...product });
    });

    lastVisible = snapshot.docs[snapshot.docs.length - 1];
    safeRenderProducts(productData);
    loadBtn.disabled = false;
  } else {
    msg.textContent = "No more products to load.";
    msg.style.color = "gray";
    loadBtn.disabled = true;
    lastVisible = null;
  }
  isLoading = false;
}

async function safeRenderProducts(data) {
  await wishlistReady;

  renderProducts(data);
}

function renderProducts(data) {
  let container = document.getElementById("product-list");
  container.innerHTML = "";

  data.forEach((product) => container.appendChild(createProductCard(product)));
}

function createProductCard(product) {
  let div = document.createElement("div");
  div.className = "product-card";

  let rating = product.ratings?.toFixed(1);
  let ref = btoa(product.id);

  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const sizeList = product.size
    .slice()
    .sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))
    .map(
      (s) => `
        <li class="size">
          <label class="size-radio">
            <input name="${product.id}" value="${s}" type="radio">
            <span class="name">${s}</span>
          </label>
        </li>
        `
    )
    .join("");

  div.innerHTML = `
        <div class="image-container">
            <img 
                src="${product.displayImage}"
                alt="${product.name}"
                title="${product.name}"
            />

            <div class="product-price">₹${product.price}</div>
        </div>
        <label class="wishlist ${
          currentWishlist.has(product.id) ? "wishlisted" : ""
        }">
            <input type="checkbox">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000">
                <path d="M12 20a1 1 0 0 1-.437-.1C11.214 19.73 3 15.671 3 9a5 5 0 0 1 8.535-3.536l.465.465.465-.465A5 5 0 0 1 21 9c0 6.646-8.212 10.728-8.562 10.9A1 1 0 0 1 12 20z"></path>
            </svg>
        </label>

        <div class="card-content">
            <div class="brand text-truncate">${product.brand}</div>
            <div class="product-name">${product.name}</div>

            <div class="rating card-rating" data-rating="${rating}">
                ${generateStarIcons(rating)}
            </div>

            <div class="size-quantity-container my-2">
                <div class="sizes">
                    Size
                    <ul class="size-content">
                        ${sizeList}
                    </ul>
                </div>

                <div class="quantities">
                  Quantity
                  <div class="quantity-controls">
                    <button class="decrease-qty" type="button">
                      <i class="bi bi-dash-lg"></i>
                    </button>
                    <div class="quantity-display" data-qty="1">1</div>
                    <button class="increase-qty" type="button">
                      <i class="bi bi-plus-lg"></i>
                    </button>
                  </div>
                </div>
            </div>
        </div>

        <div class="button-container">
            <a href="/Product-Details/p.html?ref=${ref}" class="view-button button" target="_blank">View</a>
            <button class="cart-button button">
                <i class="bi bi-cart-plus-fill"></i>
            </button>
        </div>
        `;

  // Attach event listeners
  div
    .querySelector(".cart-button")
    .addEventListener("click", () => handleAddToCart(product));

  let checkbox = div.querySelector(".wishlist input[type='checkbox']");
  if (checkbox) {
    checkbox.addEventListener("change", () =>
      handleAddToWishlist(product, () => safeRenderProducts(productData))
    );
  }

  setupQuantityControls(div.querySelector(".quantities"));

  return div;
}

export function applyFilters() {
  let minPriceInput = document.getElementById("min-price");
  let maxPriceInput = document.getElementById("max-price");
  let loadBtn = document.getElementById("load-more");

  let minPrice = parseInt(minPriceInput.value);
  let maxPrice = parseInt(maxPriceInput.value);

  const selectedRatings = getCheckedValues("Ratings").map(parseFloat);
  const selectedCategories = getCheckedValues("Category");
  const selectedBrands = getCheckedValues("Brand");
  const selectedVendors = getCheckedValues("Vendors");
  const selectedColors = getCheckedValues("Color");
  const selectedSizes = getCheckedValues("Sizes");

  filteredData = productData.filter((p) => {
    const priceMatch = p.price >= minPrice && p.price <= maxPrice;

    const ratingMatch =
      selectedRatings.length === 0 ||
      selectedRatings.some((r) => {
        let rating = parseFloat(p.ratings);
        return rating >= r && rating < r + 1;
      });

    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.includes(p.subCategory);

    const brandMatch =
      selectedBrands.length === 0 || selectedBrands.includes(p.brand);

    const vendorMatch =
      selectedVendors.length === 0 || selectedVendors.includes(p.sellerName);

    const colorMatch =
      selectedColors.length === 0 || selectedColors.includes(p.color);

    const sizeMatch =
      selectedSizes.length === 0 ||
      selectedSizes.some((s) => p.size.includes(s));

    return (
      categoryMatch &&
      priceMatch &&
      brandMatch &&
      vendorMatch &&
      colorMatch &&
      sizeMatch &&
      ratingMatch
    );
  });

  let totalLength = document.getElementById("total-length");
  totalLength.textContent = `${filteredData.length} Products`;

  isFiltering = true;
  safeRenderProducts(filteredData);
  if (loadBtn) loadBtn.disabled = true;
}

function getCheckedValues(filterTitle) {
  return Array.from(
    document.querySelectorAll(
      `input[type="checkbox"][data-filter="${filterTitle}"]:checked`
    )
  ).map((cb) => cb.nextSibling?.textContent?.trim() || cb.value.trim());
}

function sortProducts(data, sortType) {
  if (sortType === "price-asc") {
    return data.sort((a, b) => a.price - b.price);
  } else if (sortType === "price-desc") {
    return data.sort((a, b) => b.price - a.price);
  }
  return data;
}

async function handleProductSearch(searchQuery, gender) {
  let container = document.getElementById("product-list");
  let loadBtn = document.getElementById("load-more");
  let msg = document.getElementById("productListMsg");

  msg.innerHTML = "";
  container.innerHTML = "";
  loadBtn.disabled = true;
  isSearching = true;
  isSearchComplete = false;
  searchResults = [];

  let keywords = searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (keywords.length === 0) {
    msg.textContent = "Please enter a search term.";
    msg.style.color = "gray";
    isSearching = false;
    return;
  }

  let q = query(
    collection(db, "clothes"),
    orderBy("timestamp", "desc"),
    where("gender", "==", gender)
  );
  let snapshot = await getDocs(q);

  snapshot.forEach((doc) => {
    let product = doc.data();
    product.timestamp = product.timestamp?.toDate?.() || new Date(0);

    let fields = [
      product.name?.toLowerCase() || "",
      product.brand?.toLowerCase() || "",
      product.sellerName?.toLowerCase() || "",
      product.color?.toLowerCase() || "",
    ];

    let matches = keywords.every((word) =>
      fields.some((field) => field.includes(word))
    );

    if (matches) {
      searchResults.push({ id: doc.id, ...product });
    }
  });

  if (searchResults.length === 0) {
    msg.textContent = "no matching data found.";
    msg.style.color = "red";
    loadBtn.disabled = true;
  } else {
    searchLastVisible = 0;
    loadBtn.disabled = true;
  }

  let totalLength = document.getElementById("total-length");
  totalLength.textContent = `${searchResults.length} Products`;

  searchLastVisible = 0;
  renderPaginatedResults();
  loadBtn.disabled = false;
}

function renderPaginatedResults() {
  let container = document.getElementById("product-list");
  let msg = document.getElementById("productListMsg");
  let loadBtn = document.getElementById("load-more");

  let nextItems = searchResults.slice(
    searchLastVisible,
    searchLastVisible + pageSize
  );

  if (nextItems.length === 0) {
    msg.textContent = "No more search results.";
    msg.style.color = "gray";
    loadBtn.disabled = true;
    isSearchComplete = true;
    return;
  }

  nextItems.forEach((product) =>
    container.appendChild(createProductCard(product))
  );

  searchLastVisible += pageSize;
  if (searchLastVisible >= searchResults.length) {
    msg.textContent = "End of search results.";
    msg.style.color = "gray";
    loadBtn.disabled = true;
    isSearchComplete = true;
  } else {
    loadBtn.disabled = false;
  }
}
