import {
  onAuthStateChanged,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

export function showToast(message, isError = false) {
  const toastElement = document.getElementById("toastMsg");
  const toastBody = document.getElementById("toastBody");

  toastBody.textContent = message;
  toastElement.classList.remove("bg-success", "bg-danger");
  toastElement.classList.add(isError ? "bg-danger" : "bg-success");

  const bsToast = bootstrap.Toast.getOrCreateInstance(toastElement);
  bsToast.show();
}

export function setupDeleteAccount(collection) {
  let deleteAccountBtn = document.getElementById("deleteAccountBtn");

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
      let confirmed = confirm(
        "Are you sure you want to delete your account? This action is irreversible."
      );

      if (!confirmed) return;

      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            await deleteDoc(doc(db, collection, user.uid));
            await deleteUser(user);

            showToast("account deleted successfully!");
            window.location.href = "/Auth/signIn.html";
          } catch (error) {
            showToast(
              "Failed to delete account. Please re-authenticate and try again.",
              true
            );
          }
        }
      });
    });
  }
}

export function generateStarIcons(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const starIcons = [];

  for (let i = 0; i < fullStars; i++) {
    starIcons.push('<i class="bi bi-star-fill text-yellow-500"></i>');
  }
  if (halfStar) {
    starIcons.push('<i class="bi bi-star-half text-yellow-500"></i>');
  }
  while (starIcons.length < 5) {
    starIcons.push('<i class="bi bi-star text-yellow-500"></i>');
  }
  return starIcons.join(" ");
}

export function isLoggedIn(user) {
  if (!user || !user.uid) {
    window.location.href = "/Auth/signIn.html";
    return false;
  }
  return true;
}

export function setupQuantityControls(div) {
  if (!div) return;

  let quantityDisplay = div.querySelector(".quantity-display");
  let increaseBtn = div.querySelector(".increase-qty");
  let decreaseBtn = div.querySelector(".decrease-qty");
  if (!quantityDisplay || !increaseBtn || !decreaseBtn) return;

  increaseBtn.addEventListener("click", () => {
    let current = parseInt(quantityDisplay.dataset.qty || "1");
    if (current < 10) {
      current++;
      quantityDisplay.dataset.qty = current;
      quantityDisplay.textContent = current;
    }
  });
  decreaseBtn.addEventListener("click", () => {
    let current = parseInt(quantityDisplay.dataset.qty || "1");
    if (current > 1) {
      current--;
      quantityDisplay.dataset.qty = current;
      quantityDisplay.textContent = current;
    }
  });
}

export async function isUserAllowed(actionText, user) {
  let vendorDoc = await getDoc(doc(db, "vendors", user.uid));
  if (vendorDoc.exists() && vendorDoc.data().role !== "User") {
    showToast(`Only users can ${actionText}. Please login as a User.`, true);
    return false;
  }
  return true;
}

export function getSelectedQuantity() {
  let quantityDisplay = document.querySelector(".quantity-display");
  return parseInt(quantityDisplay?.dataset.qty || "1");
}
