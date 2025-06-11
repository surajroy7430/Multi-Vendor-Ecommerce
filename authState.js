import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { showToast } from "./script.js";

export let currentUser = null;
export let currentWishlist = new Set();
export let wishlistFetched = false;

let resolveWishlist;
export let wishlistReady = new Promise((res, rej) => {
  resolveWishlist = res;
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  currentWishlist.clear();
  wishlistFetched = false;

  if (user) {
    try {
      let wishSnapshot = await getDocs(
        collection(db, "users", user.uid, "wishlist")
      );

      wishSnapshot.forEach((doc) => {
        currentWishlist.add(doc.id);
      });
      wishlistFetched = true;
      resolveWishlist();
    } catch (error) {
      showToast("Failed to load wishlist. Please try again.");
      resolveWishlist();
    }
  } else {
    resolveWishlist();
  }
});
