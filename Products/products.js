import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
    doc, getDoc, getDocs, collection, query, where, limit,
    startAfter, setDoc, updateDoc, orderBy
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let pageSize = 100;
let productData = [];
let allVendors = [];
let lastVisible = null;
let isLoading = false;
let debouncedTimer;
let searchResults = [];
let searchLastVisible = null;
let isSearching = false;
let isSearchComplete = false;
let filteredData = [];
let isFiltering = false;

document.addEventListener("DOMContentLoaded", () => {
    let gender = document.body.dataset.gender || "all";

    if (!gender) {
        console.error("Gender not defined on <body> tag.");
        return;
    }

    getProductsFirstPage(gender);

    let loadBtn = document.getElementById("load-more")
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

    // Filter and sort
    let priceRange = document.getElementById("price-range");
    let priceValue = document.getElementById("price-value");
    let vendorSelect = document.getElementById("vendor-filter");
    let ratingSelect = document.getElementById("rating-filter");
    let sortSelect = document.getElementById("price-sort");

    priceRange.addEventListener("input", () => {
        priceValue.textContent = `₹0 - ₹${priceRange.value}`;
        applyFilters();
    });

    vendorSelect.addEventListener("change", applyFilters);
    ratingSelect.addEventListener("change", applyFilters);
    sortSelect.addEventListener("change", applyFilters);
});

function populateVendors() {
    let vendorSelect = document.getElementById("vendor-filter");

    vendorSelect.innerHTML = `<option value="">All Vendors</option>`;
    allVendors.forEach(vendor => {
        vendorSelect.innerHTML += `<option value="${vendor}">${vendor}</option>`;
    });
}

function attachEventListeners(gender) {
    let searchInput = document.querySelectorAll("#search-input")

    searchInput.forEach(input => {
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
                }
                else {
                    handleProductSearch(searchQuery, gender);
                }
            }, 500);
        })
    });

    document.getElementById("price-sort").addEventListener("change", () => {
        let sortType = document.getElementById("price-sort").value;

        if (isSearching) {
            searchResults = sortProducts(searchResults, sortType);
            renderProducts(searchResults);
        } else if (isFiltering) {
            filteredData = sortProducts(filteredData, sortType);
            renderProducts(filteredData);
        } else {
            productData = sortProducts(productData, sortType);
            renderProducts(productData);
        }
    });
}

async function getProductsFirstPage(gender) {
    let q;

    if (gender === "all") {
        q = query(
            collection(db, "clothes"),
            orderBy("timestamp", "desc"),
            limit(pageSize)
        );
    }
    else {
        q = query(
            collection(db, "clothes"),
            where("gender", "==", gender),
            orderBy("timestamp", "desc"),
            limit(pageSize)
        );
    }


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

    let vendorSet = new Set(allVendors);
    productData.length = 0;
    snapshot.forEach((doc) => {
        let product = doc.data();
        product.timestamp = product.timestamp?.toDate?.() || new Date(0);
        productData.push({ id: doc.id, ...product });

        if (product.sellerName) {
            vendorSet.add(product.sellerName);
        }
    });

    allVendors = Array.from(vendorSet);
    populateVendors();

    lastVisible = snapshot.docs[snapshot.docs.length - 1];
    renderProducts(productData);
    loadBtn.disabled = false;
    isLoading = false;
}

async function getProductsNextPage(gender) {
    if (!lastVisible || isLoading) return;

    isLoading = true;
    let loadBtn = document.getElementById("load-more");
    let msg = document.getElementById("productListMsg");
    loadBtn.disabled = true;

    let q;
    if (gender === "all") {
        q = query(
            collection(db, "clothes"),
            orderBy("timestamp", "desc"),
            startAfter(lastVisible),
            limit(pageSize)
        );
    }
    else {
        q = query(
            collection(db, "clothes"),
            where("gender", "==", gender),
            orderBy("timestamp", "desc"),
            startAfter(lastVisible),
            limit(pageSize)
        );
    }

    let snapshot = await getDocs(q);

    if (!snapshot.empty) {
        let vendorSet = new Set(allVendors);

        snapshot.forEach((doc) => {
            let product = doc.data();
            product.timestamp = product.timestamp?.toDate?.() || new Date(0);
            productData.push({ id: doc.id, ...product });

            if (product.sellerName) {
                vendorSet.add(product.sellerName);
            }
        })

        allVendors = Array.from(vendorSet);
        populateVendors();

        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        renderProducts(productData);
        loadBtn.disabled = false;
    }
    else {
        msg.textContent = "No more products to load.";
        msg.style.color = "gray";
        loadBtn.disabled = true;
        lastVisible = null;
    }
    isLoading = false;
}

function renderProducts(data) {
    let container = document.getElementById("product-list");
    container.innerHTML = "";

    data.forEach((product) => {
        let rating = product.ratings?.toFixed(1);
        let div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <div class="card-image">
                <p class="card-sellerTag">${product.sellerTag}</p>
                <img src="${product.displayImage}" alt="${product.name}" title="${product.name}" />
                <p class="card-rating"><i class="bi bi-star-fill"></i> ${rating}</p>
            </div>
            <div class="card-content">
                <p class="card-sellerName">${product.sellerName}</p>
                <p class="card-title">${product.name}</p>
                <p class="card-price">₹${product.price}</p>
            </div>
        `;
        div.addEventListener("click", () => openQuickViewModal(product));
        container.appendChild(div);
    });
}

function applyFilters() {
    let priceRange = document.getElementById("price-range");
    let vendorSelect = document.getElementById("vendor-filter");
    let ratingSelect = document.getElementById("rating-filter");
    let loadBtn = document.getElementById("load-more");

    let maxPrice = parseInt(priceRange.value);
    let selectedVendor = vendorSelect.value;
    let minRating = parseFloat(ratingSelect.value) || 0;

    filteredData = productData.filter(p => {
        let rating = p.ratings;
        return (
            p.price <= maxPrice &&
            (!selectedVendor || p.sellerName === selectedVendor) &&
            (minRating === 0 || (rating >= minRating && rating < minRating + 1))
        );
    });

    isFiltering = true;
    renderProducts(filteredData);
    loadBtn.disabled = true;
}
function sortProducts(data, sortType) {
    if (sortType === "price-asc") {
        return data.sort((a, b) => a.price - b.price);
    }
    else if (sortType === "price-desc") {
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

    let q;
    if (gender === "all") {
        q = query(
            collection(db, "clothes"),
            orderBy("timestamp", "desc"),
            limit(pageSize)
        );
    }
    else {
        q = query(
            collection(db, "clothes"),
            orderBy("timestamp", "desc"),
            where("gender", "==", gender),
            limit(pageSize)
        );
    }
    let snapshot = await getDocs(q);

    snapshot.forEach(doc => {
        let product = doc.data();
        product.timestamp = product.timestamp?.toDate?.() || new Date(0);
        let matchedName = product.name.trim().toLowerCase().includes(searchQuery);
        let matchedSeller = product.sellerName.trim().toLowerCase().includes(searchQuery);
        if (matchedName || matchedSeller) {
            searchResults.push({ id: doc.id, ...product });
        }
    });

    if (searchResults.length === 0) {
        msg.textContent = "no matching data found.";
        msg.style.color = "red";
        loadBtn.disabled = true;
        isSearching = false;
        return;
    }

    searchLastVisible = 0;
    renderPaginatedResults();
    loadBtn.disabled = false;
}

function renderPaginatedResults() {
    let container = document.getElementById("product-list");
    let msg = document.getElementById("productListMsg");
    let loadBtn = document.getElementById("load-more");

    let nextItems = searchResults.slice(searchLastVisible, searchLastVisible + pageSize);

    if (nextItems.length === 0) {
        msg.textContent = "No more search results.";
        msg.style.color = "gray";
        loadBtn.disabled = true;
        isSearchComplete = true;
        return;
    }

    nextItems.forEach((product) => {
        let rating = product.ratings?.toFixed(1);
        let div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <div class="card-image">
                <p class="card-sellerTag">${product.sellerTag}</p>
                <img src="${product.displayImage}" alt="${product.name}" title="${product.name}" />
                <p class="card-rating"><i class="bi bi-star-fill"></i> ${rating}</p>
            </div>
            <div class="card-content">
                <p class="card-sellerName">${product.sellerName}</p>
                <p class="card-title">${product.name}</p>
                <p class="card-price">₹${product.price}</p>
            </div>
        `;
        div.addEventListener("click", () => openQuickViewModal(product));
        container.appendChild(div);
    });

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

function openQuickViewModal(product) {
    let modal = document.getElementById("quick-view-modal");
    modal.classList.add("show");

    let modalBody = document.querySelector(".modal-body");
    let addToCartHTML = "";

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                let userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().role === "User") {
                    addToCartHTML = `
                        <button class="btn btn-primary mt-3" id="addToCartBtn">Add to Cart</button>
                    `;
                }
            } catch (err) {
                console.error("Error checking user role:", err.message);
            }
        }

        modalBody.innerHTML = `
            <div class="modal-upper-details">
                <img src="${product.displayImage}" alt="${product.name}" id="modal-image">
                <div class="modal-details">
                    <h5 class="modal-product-name">${product.name}</h5>
                    <p class="modal-brand">Brand: <span>${product.brand ?? "Unknown"}</span></p>
                    <p class="modal-sellerName">Vendor: <span>${product.sellerName ?? "Unknown"}</span></p>
                    <div class="modal-price-container">
                        <p class="modal-price">₹<span>${product.price}</span></p>
                        <p class="modal-price-tag">inclusive of all taxes</p>
                    </div>
                    <p class="modal-size">
                        Available Size: <span>${product.size.join(", ") ?? "N/A"}</span>
                    </p>
                    <p class="modal-color">
                        Colour: <span style="background: ${product.color?.toLowerCase()};"></span>
                    </p>
                    <p class="modal-rating">
                        Rating: ${product.ratings?.toFixed(1) ?? "N/A"} <i class="bi bi-star-fill"></i>
                    </p>
                    <p class="modal-sellerTag">${product.sellerTag}</p>
                    ${addToCartHTML}
                </div>
            </div>
            <hr>
            <div class="modal-description">
                <p>Product Description</p>
                <p>${product.description ?? "No description available."}</p>
            </div>
        `;

        let addToCartBtn = document.getElementById("addToCartBtn");
        if (addToCartBtn) {
            addToCartBtn.addEventListener("click", async () => {
                try {
                    let cartRef = doc(db, "users", user.uid, "cart", product.id);
                    let existingItem = await getDoc(cartRef);

                    if (existingItem.exists()) {
                        let currentQuantity = existingItem.data().quantity || 1;
                        await updateDoc(cartRef, { quantity: currentQuantity + 1 });
                    }
                    else {
                        await setDoc(cartRef, { ...product, quantity: 1 });
                    }

                    alert("product added to cart");
                } catch (error) {
                    console.log("add cart error:", error.message);
                }
            });
        }
    });
}

function closeQuickView() {
    let modal = document.getElementById("close-quick-view");
    if (modal) {
        modal.addEventListener("click", () => {
            document.getElementById("quick-view-modal").classList.remove("show");
        });
    }
}
closeQuickView();