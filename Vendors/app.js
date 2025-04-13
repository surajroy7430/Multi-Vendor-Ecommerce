import { auth, db } from "../firebase-config.js";
import { deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
    doc, deleteDoc, getDoc, getDocs, collection, addDoc,
    setDoc, query, updateDoc, onSnapshot, where
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let currentVendorId;
let vendorBusinessName = "";
let vendorAddress = "";
let formMode = "add";
let editingProductId = null;
let timestamp = Date.now();

document.addEventListener("DOMContentLoaded", () => {
    let email = document.getElementById("vendor-email-to-show");
    let businessName = document.getElementById("vendor-business-to-show");
    let businessAddress = document.getElementById("vendor-address-to-show");

    onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        currentVendorId = user.uid;

        if (email) email.value = user.email;

        let vendorDoc = await getDoc(doc(db, "vendors", currentVendorId));
        if (vendorDoc.exists()) {
            let vendorData = vendorDoc.data();
            vendorBusinessName = vendorData.businessName;
            vendorAddress = vendorData.address;

            if (businessName) businessName.value = vendorData.businessName;
            if (businessAddress) businessAddress.value = vendorData.address;
        }
        else {
            if (businessName) businessName.value = "Unknown Vendor";
            if (businessAddress) businessAddress.value = "Unknown Vendor";
        }

        createNewProduct();
        showVendorProducts();
    });
});

function setupVendorDeleteAccount() {
    let deleteAccountBtn = document.getElementById("deleteAccountBtn");

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to delete your account? This action is irreversible.")) return;

            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        await deleteDoc(doc(db, "vendors", user.uid));
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
}
setupVendorDeleteAccount();

function generateDescription(productName, brand, gender, businessName, address) {
    return `${productName} from ${brand}<br>
        <b style="font-family: montserrat-bold, sans-serif"> Country of Origin - </b>India<br><br>
        <b style="font-family: montserrat-bold, sans-serif"> Manufactured By - </b>${businessName}, ${address}<br><br>
        <b style="font-family: montserrat-bold, sans-serif"> Packed By - </b>${businessName}, ${address}<br><br>
        <b style="font-family: montserrat-bold, sans-serif"> Commodity - </b>${gender}'s Wear<br>
    `;
}

function createNewProduct() {
    let addProductForm = document.getElementById("add-product-form");
    if (addProductForm) {
        addProductForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            let name = document.getElementById("product-name").value.trim();
            let displayImage = document.getElementById("product-image").value.trim();
            let brand = document.getElementById("product-brand").value.trim();
            let price = parseFloat(document.getElementById("product-price").value);
            let color = document.getElementById("product-color").value.trim();
            let sellerTag = document.getElementById("product-tag").value.trim();
            let gender = document.getElementById("product-gender").value;
            let ratings = parseFloat(document.getElementById("product-ratings").value);
            let size = document.getElementById("product-size").value.split(",").map(s => s.trim().toUpperCase());

            let description = generateDescription(name, brand, gender, vendorBusinessName, vendorAddress);

            let productData = {
                name, displayImage, brand, price, color, sellerName: vendorBusinessName, sellerTag,
                description, gender, ratings, size, category: "clothes", vendorId: currentVendorId,
                timestamp
            };


            if (formMode === "edit" && editingProductId) {
                await updateDoc(doc(db, "clothes", editingProductId), productData);
                await updateDoc(doc(db, "vendors", currentVendorId, "myproducts", editingProductId), productData);
                alert("Product updated!");
            } else {
                let myProductRef = await addDoc(collection(db, "vendors", currentVendorId, "myproducts"), productData);

                // globally adding product
                await setDoc(doc(db, "clothes", myProductRef.id), {
                    ...productData,
                    productId: myProductRef.id
                });
                alert("Product added successfully!");
            }

            addProductForm.reset();
            formMode = "add";
            editingProductId = null;
        });
    }
}

function showVendorProducts() {
    let productsDiv = document.getElementById("added-products");
    let productAddMsg = document.getElementById("productAddMsg");

    let clothesRef = collection(db, "clothes");
    let clothesQuery = query(clothesRef, where("vendorId", "==", currentVendorId));

    onSnapshot(clothesQuery, (snapshot) => {
        productsDiv.innerHTML = "";

        if (snapshot.empty) {
            productAddMsg.textContent = "You haven't added any products yet.";
            return;
        }

        productAddMsg.textContent = "";

        let sorted = snapshot.docs.sort((a, b) =>
            new Date(b.data().timestamp) - new Date(a.data().timestamp)
        );

        sorted.forEach((docSnap) => {
            let product = docSnap.data();
            let rating = product.ratings?.toFixed(1);

            let card = document.createElement("div");
            card.className = "vendor-product-card"
            card.innerHTML = `
                <div class="card-item-image">
                        <p class="card-sellerTag">${product.sellerTag}</p>
                        <img src="${product.displayImage}" alt="${product.name}" title="${product.name}" />
                        <p class="card-rating"><i class="bi bi-star-fill"></i> ${rating}</p>
                    </div>
                    <div class="card-item-content">
                        <p class="card-sellerName">${product.sellerName}</p>
                        <p class="card-title">${product.name}</p>
                        <p class="card-creation">
                            Date Added: ${new Date(product.timestamp).toLocaleString()}
                        </p>
                        <p class="card-price">₹${product.price}</p>
                        <div class="btn-toolbar justify-content-between mt-3">
                            <button onclick="editProduct('${docSnap.id}')" class="btn btn-success btn-sm">
                                Update
                            </button>
                            <button onclick="deleteProduct('${docSnap.id}')" class="btn btn-danger btn-sm">
                                Delete
                            </button>
                        </div>
                    </div>
            `;
            productsDiv.appendChild(card);
        });
    });
}

window.deleteProduct = async function (productId) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    await deleteDoc(doc(db, "clothes", productId));

    let myProductsRef = collection(db, "vendors", currentVendorId, "myproducts");
    let myProductQuery = query(myProductsRef, where("productId", "==", productId));
    let snapshot = await getDocs(myProductQuery);
    snapshot.forEach(docSnap => {
        deleteDoc(doc(db, "vendors", currentVendorId, "myproducts", docSnap.id));
    });

    alert("Product deleted successfully!");
    showVendorProducts();
};

window.editProduct = async function (productId) {
    let productDoc = await getDoc(doc(db, "clothes", productId));
    if (!productDoc.exists()) return alert("Product not found!");

    let data = productDoc.data();

    document.getElementById("product-name").value = data.name;
    document.getElementById("product-image").value = data.displayImage;
    document.getElementById("product-brand").value = data.brand;
    document.getElementById("product-price").value = data.price;
    document.getElementById("product-color").value = data.color;
    document.getElementById("product-tag").value = data.sellerTag;
    document.getElementById("product-gender").value = data.gender;
    document.getElementById("product-ratings").value = data.ratings;
    document.getElementById("product-size").value = data.size.join(", ");

    formMode = "edit";
    editingProductId = productId;
};
