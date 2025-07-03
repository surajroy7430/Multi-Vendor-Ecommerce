import { auth, db } from "../firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { setupDeleteAccount } from "../script.js";
import { loadUserCartItems, loadWishlistItems } from "./Cart/carts.js";
import { loadUserWishlistItems } from "./Wishlist/wishlists.js";
import { loadUserOrderItems } from "./Orders/script/orders.js";

document.addEventListener("DOMContentLoaded", () => {
  let userName = document.getElementById("user-name-to-show");
  let userEmail = document.getElementById("user-email-to-show");
  let userGender = document.getElementById("user-gender-to-show");

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    if (userEmail) userEmail.value = user.email;

    let usersDoc = await getDoc(doc(db, "users", user.uid));

    if (usersDoc.exists()) {
      let usersData = usersDoc.data();
      if (userName) userName.value = usersData.name;
      if (userGender) userGender.textContent = usersData.gender;

      if (
        window.location.pathname === "/Vendor/Dashboard.html" ||
        window.location.pathname === "/Vendor/My-Products.html"
      ) {
        window.location.href = "/User/Dashboard.html";
      }
    } else {
      if (userName) userName.value = "Unknown User";
    }

    loadUserWishlistItems();
    loadWishlistItems()
    loadUserCartItems();
    loadUserOrderItems();

    setupDeleteAccount("users");
  });

  let profileBtn = document.querySelectorAll(".profile-aside-btn");
  let profileSection = document.querySelectorAll(".profile-section");
  if (profileBtn) {
    profileBtn.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.section;

        if (profileSection) {
          profileSection.forEach((section) => {
            section.classList.add("hidden");
          });
        }

        if (targetId) {
          document.getElementById(targetId).classList.remove("hidden");
        }

        profileBtn.forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");
      });
    });
  }

  // Logout handler
  let logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          window.location.href = "/Auth/signIn.html";
        })
        .catch(console.log);
    });
  }
});
