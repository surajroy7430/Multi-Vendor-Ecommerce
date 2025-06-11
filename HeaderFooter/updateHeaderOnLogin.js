import { auth, db } from "../firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { watchCartBadge } from "../User/Cart/carts.js";

export function authListener() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    let userDoc = await getDoc(doc(db, "users", user.uid));
    let vendorDoc = await getDoc(doc(db, "vendors", user.uid));

    let role = "",
      name = "",
      dashboardUrl = "",
      cartUrl = "";

    if (userDoc.exists()) {
      role = "User";
      name = userDoc.data().name;
      dashboardUrl = "/User/Dashboard.html";
      cartUrl = "/User/Cart/Cart.html";
    } else if (vendorDoc.exists()) {
      role = "Vendor";
      name = vendorDoc.data().businessName;
      dashboardUrl = "/Vendor/Dashboard.html";
    }

    // Desktop
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      navbar.innerHTML = `
                <div class="vr"></div>
                <div class="dropdown">
                    <a class="btn bt-dropdown" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-person-circle"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end italic text-sm">
                        <li><span class="dropdown-item-text">Hi, ${name}</span></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="${dashboardUrl}">My Account</a></li>
                        ${
                          role === "User"
                            ? '<li><a class="dropdown-item" href="/User/Wishlist/My-Wishlist.html">My Wishlist</a></li>'
                            : ""
                        }
                        ${
                          role === "User"
                            ? '<li><a class="dropdown-item" href="/User/Orders/My-Orders.html">My Orders</a></li>'
                            : ""
                        }
                        ${
                          role === "Vendor"
                            ? '<li><a class="dropdown-item" href="/Vendor/My-Products.html">My Products</a></li>'
                            : ""
                        }
                        <li><a class="logoutBtn dropdown-item text-danger" href="#">Logout</a></li>
                    </ul>
                </div>
                ${
                  role === "User"
                    ? `<a href="${cartUrl}" class="cart-icon position-relative">
                        <i class="bi bi-bag"></i>
                        <span 
                            id="cart-badge" 
                            class="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger d-none"
                        >0</span>
                    </a>`
                    : ""
                }
            `;
    }

    // Mobile
    const loginLink = document.querySelector(".menu-loginbtn");
    const accountMenu = document.querySelector(".profile-menu");
    const cartIcon = document.querySelector(".mobile-header .cart-icon");

    if (loginLink) {
      loginLink.outerHTML = `<div class="loggedin-info">${role}</div>`;
    }

    if (accountMenu) {
      accountMenu.innerHTML = `
                <p>PROFILE</p>
                <a href="${dashboardUrl}">Account</a>
                ${
                  role === "User"
                    ? '<a href="/User/Wishlist/My-Wishlist.html">My Wishlist</a>'
                    : ""
                }
                ${
                  role === "User"
                    ? '<a href="/User/Orders/My-Orders.html">My Orders</a>'
                    : ""
                }
                ${
                  role === "Vendor"
                    ? '<a href="/Vendor/My-Products.html">My Products</a>'
                    : ""
                }
                <a href="#" class="logoutBtn text-danger">Logout</a>
            `;
    }

    if (cartIcon) {
      cartIcon.outerHTML = `
                ${
                  role === "User"
                    ? `<a href="${cartUrl}" class="cart-icon position-relative">
                        <i class="bi bi-bag"></i>
                        <span 
                            id="mobile-cart-badge" 
                            class="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger d-none"
                        >0</span>
                    </a>`
                    : ""
                }
            `;
    }

    // Logout handler
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("logoutBtn")) {
        e.preventDefault();
        signOut(auth)
          .then(() => {
            window.location.href = "/Auth/signIn.html";
          })
          .catch(console.log);
      }
    });

    if (role === "User") {
      watchCartBadge(user.uid);
    }
  });
}
