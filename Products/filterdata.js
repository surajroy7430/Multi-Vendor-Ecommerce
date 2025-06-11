import { db } from "../firebase-config.js";
import {
  getDocs,
  collection,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const clothesRef = collection(db, "clothes");

export async function fetchAndPopulateFilterTerms(gender) {
  let q = query(clothesRef, where("gender", "==", gender))
  const snapshot = await getDocs(q);

  const brandSet = new Set();
  const sellerSet = new Set();
  const categorySet = new Set();
  const colorSet = new Set();
  const sizeSet = new Set();

  snapshot.forEach((doc) => {
    const product = doc.data();

    if (product.brand) brandSet.add(product.brand);
    if (product.sellerName) sellerSet.add(product.sellerName);
    if (product.subCategory) categorySet.add(product.subCategory);
    if (product.color) colorSet.add(product.color);
    if (Array.isArray(product.size)) {
      product.size.forEach((s) => sizeSet.add(s));
    }
  });

  return {
    categories: Array.from(categorySet).sort((a,b) => a.localeCompare(b)),
    brands: Array.from(brandSet).sort((a,b) => a.localeCompare(b)),
    sellers: Array.from(sellerSet).sort((a,b) => a.localeCompare(b)),
    colors: Array.from(colorSet).sort((a,b) => a.localeCompare(b)),
    sizes: Array.from(sizeSet),
  };
}
