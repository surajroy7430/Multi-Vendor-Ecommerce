import { auth, db } from "../firebase-config.js";
import { deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
    addDoc, doc, deleteDoc, collection, getDoc, getDocs, onSnapshot, writeBatch,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let cartProducts = [];
let orderedProducts = [];
let timestamp = Date.now();

document.addEventListener("DOMContentLoaded", () => {
    let userName = document.getElementById("user-name-to-show");
    let userEmail = document.getElementById("user-email-to-show");

    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        if (userEmail) userEmail.value = user.email;

        let usersDoc = await getDoc(doc(db, "users", user.uid));
        if (usersDoc.exists()) {
            let usersData = usersDoc.data();
            if(userName) userName.value = usersData.name;
        }
        else {
            if(userName) userName.value = "Unknown User";
        }

        setupUserDeleteAccount();

        loadUserCartItems();
        loadUserOrderItems();
    });

});

function setupUserDeleteAccount() {
    let deleteAccountBtn = document.getElementById("deleteAccountBtn");

    if (!deleteAccountBtn) return;

    deleteAccountBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete your account? This action is irreversible.")) return;

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    await deleteDoc(doc(db, "users", user.uid));
                    await deleteUser(user);

                    alert("account deleted successfully!");
                    window.location.href = "/Auth/signIn.html";
                } catch (error) {
                    alert("Failed to delete account. Please re-authenticate and try again.");
                }
            }
        });
    });
}

function loadUserCartItems() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        let cartContainer = document.getElementById("cartContainer");

        try {
            let cartSnapshot = await getDocs(collection(db, "users", user.uid, "cart"));

            if (cartSnapshot.empty) {
                cartContainer.innerHTML = `
                    <div class="empty-cart">
                        <img 
                            src="https://images.bewakoof.com/images/doodles/empty-cart-page-doodle.png" 
                            alt="empty-bag"
                            width="170px"
                        >
                        <p>Nothing in the bag</p>
                        <a href="/Products/mens.html">Continue Shopping</a>
                    </div>
                `;
                return;
            }

            cartContainer.innerHTML = "";

            cartSnapshot.forEach(doc => {
                let product = doc.data();
                let productId = doc.id;
                cartProducts.push(product);

                let rating = product.ratings?.toFixed(1);
                let div = document.createElement("div");
                div.className = "cart-items";

                div.innerHTML += `
                    <div class="cart-item-image">
                        <p class="card-sellerTag">${product.sellerTag}</p>
                        <img src="${product.displayImage}" alt="${product.name}" title="${product.name}" />
                        <p class="card-rating"><i class="bi bi-star-fill"></i> ${rating}</p>
                    </div>
                    <div class="cart-item-content">
                        <p class="card-sellerName">${product.sellerName}</p>
                        <p class="card-title">${product.name}</p>
                        <p class="card-price">₹${product.price * product.quantity}</p>
                        <p class="card-quantity">Quantity: ${product.quantity}</p>
                        <div class="btn-toolbar justify-content-between mt-3">
                            <button onclick="orderSingleProduct('${productId}')" class="btn btn-success btn-sm">
                                Order
                            </button>
                            <button onclick="removeFromCart('${productId}')" class="btn btn-danger btn-sm">
                                Remove
                            </button>
                        </div>
                    </div>
                `;
                cartContainer.appendChild(div);
            });

            let orderBtn = document.createElement("button");
            orderBtn.className = "btn btn-primary mt-4";
            orderBtn.textContent = "Order Now";
            orderBtn.onclick = () => orderAllProducts(cartProducts, user.uid);

            let cartAllItems = document.querySelector(".cart-all-items");
            cartAllItems.appendChild(orderBtn);
        } catch (error) {
            return;
        }
    });
}

window.removeFromCart = async function (productId) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        try {
            await deleteDoc(doc(db, "users", user.uid, "cart", productId));

            cartProducts = cartProducts.filter(p => p.id === productId);

            loadUserCartItems();
        } catch (error) {
            alert("Error removing item. Please try again.");
        }
    });
}

export function watchCartBadge(uid) {
    let desktopCartBadge = document.getElementById("cart-badge");
    let MobileCartBadge = document.getElementById("mobile-cart-badge");

    if (!desktopCartBadge) return;
    if (!MobileCartBadge) return;

    onSnapshot(collection(db, "users", uid, "cart"), (snapshot) => {
        let currentItemIds = new Set();
        snapshot.forEach(doc => {
            currentItemIds.add(doc.id);
        });

        let count = currentItemIds.size;

        if (count > 0) {
            desktopCartBadge.classList.remove("d-none");
            MobileCartBadge.classList.remove("d-none");

            desktopCartBadge.textContent = count;
            MobileCartBadge.textContent = count;
        }
        else {
            desktopCartBadge.classList.add("d-none");
            MobileCartBadge.classList.add("d-none");
        }
    });
}

window.orderSingleProduct = async function (productId) {
    try {
        let user = auth.currentUser;
        if (!user) return;

        let productRef = doc(db, "users", user.uid, "cart", productId)
        let productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            alert("Product not found in the cart.");
            return;
        }

        let product = productSnap.data();
        await addDoc(collection(db, "users", user.uid, "orders"), {
            ...product,
            timestamp,
            orderStatus: "Pending"
        });
        await deleteDoc(productRef);

        alert("Product Ordered Successfully!");
        window.location.href = "/Users/My-Orders.html";
    } catch (error) {
        console.log("error ordering product", error.message);
    }
}
window.orderAllProducts = async function (products, uid) {
    try {
        let batch = writeBatch(db);
        let ordersRef = collection(db, "users", uid, "orders");

        for (let product of products) {
            let orderRef = doc(ordersRef);
            batch.set(orderRef, {
                ...product,
                timestamp,
                orderStatus: "Pending"
            });

            let cartRef = doc(db, "users", uid, "cart", product.id);
            batch.delete(cartRef);
        }

        await batch.commit();

        alert("Product Ordered Successfully!");
        window.location.href = "/Users/My-Orders.html";
    } catch (error) {
        console.log("error ordering product", error);
    }
}

function loadUserOrderItems() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        let orderContainer = document.getElementById("orderContainer");

        try {
            let orderSnapshot = await getDocs(collection(db, "users", user.uid, "orders"));

            if (orderSnapshot.empty) {
                orderContainer.innerHTML = `
                    <div class="no-orders">
                        <img 
                            src="https://i.ibb.co/dJ1K7RBH/empty-orders.png" 
                            alt="no-orders"
                            width="170px"
                        >
                        <p>No orders placed yet!</p>
                        <a href="/Products/mens.html">Continue Shopping</a>
                    </div>
                `;
                return;
            }

            orderContainer.innerHTML = "";

            orderSnapshot.forEach(doc => {
                let product = doc.data();
                let productId = doc.id;
                orderedProducts.push(product);

                let div = document.createElement("div");
                div.className = "order-items";

                div.innerHTML += `
                    <div class="cart-item-image">
                        <p class="card-orderStatus">${product.orderStatus}</p>
                        <img src="${product.displayImage}" alt="${product.name}" title="${product.name}" />
                    </div>
                    <div class="order-item-content">
                        <p class="card-sellerName">${product.sellerName}</p>
                        <p class="card-title">${product.name}</p>
                        <p class="order-price">Total Price: <span>₹${product.price * product.quantity}</span></p>
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
            await deleteDoc(doc(db, "users", user.uid, "orders", productId));

            orderedProducts = orderedProducts.filter(p => p.id === productId);

            loadUserOrderItems();
        } catch (error) {
            alert("Error canceling order. Please try again.");
        }
    });
}