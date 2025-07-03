import { db } from "../../firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { currentUser, currentWishlist } from "../../authState.js";
import {
  getSelectedQuantity,
  isLoggedIn,
  isUserAllowed,
  showToast,
} from "../../script.js";

export async function handleAddToCart(product) {
  if (!isLoggedIn(currentUser)) return;

  if (!(await isUserAllowed("add items to cart", currentUser))) return;

  let availableSize = Array.isArray(product.size)
    ? product.size[0]
    : product.size || "Free Size";

  let cartRef = doc(
    db,
    "users",
    currentUser.uid,
    "cart",
    `${product.id}_${availableSize}`
  );

  try {
    let docSnap = await getDoc(cartRef);

    if (docSnap.exists()) {
      let existingQty = docSnap.data().quantity || 1;
      await updateDoc(cartRef, { quantity: existingQty + 1 });
    } else {
      await setDoc(cartRef, { ...product, size: availableSize, quantity: 1 });
    }

    showToast("Product added to cart.");
  } catch (error) {
    showToast("Add cart error: " + error.message, true);
  }
}

export async function handleAddToCartWithSize(product) {
  if (!isLoggedIn(currentUser)) return;

  if (!(await isUserAllowed("add items to cart", currentUser))) return;

  let selectedSize = document.querySelector(
    `input[name="${product.id}"]:checked`
  )?.value;

  if (!selectedSize) {
    showToast("Please select a size before adding to cart.", true);
    return;
  }

  let quantity = getSelectedQuantity();

  let cartRef = doc(
    db,
    "users",
    currentUser.uid,
    "cart",
    `${product.id}_${selectedSize}`
  );

  try {
    let docSnap = await getDoc(cartRef);

    if (docSnap.exists()) {
      let existingQty = docSnap.data().quantity || 1;
      await updateDoc(cartRef, { quantity: existingQty + quantity });
    } else {
      await setDoc(cartRef, { ...product, size: selectedSize, quantity });
    }

    showToast("Product added to cart.");
  } catch (error) {
    showToast("Add cart error: " + error.message, true);
  }
}

export async function handleAddToWishlist(product, renderFn) {
  if (!isLoggedIn(currentUser)) return;

  if (!(await isUserAllowed("manage wishlist", currentUser))) return;

  let wishRef = doc(db, "users", currentUser.uid, "wishlist", product.id);

  try {
    let docSnap = await getDoc(wishRef);

    if (docSnap.exists()) {
      await deleteDoc(wishRef);
      currentWishlist.delete(product.id);

      showToast("Removed from wishlist", true);
    } else {
      await setDoc(wishRef, product);
      currentWishlist.add(product.id);

      showToast("Wishlisted");
    }

    renderFn();
  } catch (error) {
    showToast("wishlist error: " + error.message, true);
  }
}
