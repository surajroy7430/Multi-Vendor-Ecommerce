import { auth, db } from "../firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    let userForm = document.getElementById("user-register-form");
    let vendorForm = document.getElementById("vendor-register-form");
    let signInForm = document.getElementById("signIn-form");
    let showRolePopup = document.getElementById("showRolePopup");
    let rolePopup = document.getElementById("role-popup");
    let closePopup = document.getElementById("closePopup");

    if (userForm) userForm.addEventListener("submit", registerUser);
    if (vendorForm) vendorForm.addEventListener("submit", registerVendor);
    if (signInForm) signInForm.addEventListener("submit", signIn);

    if (showRolePopup) {
        showRolePopup.addEventListener("click", (e) => {
            e.preventDefault();
            rolePopup.classList.add("show");
        });
    }

    if (closePopup) {
        closePopup.addEventListener("click", () => {
            rolePopup.classList.remove("show");
        });
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            let userDoc = getDoc(doc(db, "users", user.uid));
            let vendorDoc = getDoc(doc(db, "vendors", user.uid));

            if (userDoc.exists()) {
                if (
                    window.location.pathname === "/Auth/signIn.html" || 
                    window.location.pathname === "/Auth/userSignUp.html" ||
                    window.location.pathname === "/Auth/vendorSignUp.html"
                ) {
                    window.location.href = "/Users/Dashboard.html";
                }
            } else if (vendorDoc.exists()) {
                if (
                    window.location.pathname === "/Auth/signIn.html" || 
                    window.location.pathname === "/Auth/userSignUp.html" ||
                    window.location.pathname === "/Auth/vendorSignUp.html"
                ) {
                    window.location.href = "/Vendors/Dashboard.html";
                }
            }
        }
        else {
            if (
                window.location.pathname === "/Users/Dashboard.html" || 
                window.location.pathname === "/Vendors/Dashboard.html"
            ) {
                window.location.href = "/Auth/signIn.html";
            }
        }
    });

    window.redirectToRegister = (role) => {
        if (role === "user") {
            window.location.href = "/Auth/userSignUp.html";
        }
        else if (role === "vendor") {
            window.location.href = "/Auth/vendorSignUp.html";
        }
    }
});

async function registerUser(event) {
    event.preventDefault();

    let role = "User";
    let name = document.getElementById("user-register-name").value.trim();
    let email = document.getElementById("user-register-email").value.trim();
    let password = document.getElementById("user-register-password").value.trim();
    let msg = document.getElementById("userMsg");

    try {
        let userCredential = await createUserWithEmailAndPassword(auth, email, password);
        let user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), { email, role, name });

        msg.textContent = "Registration Successful.";
        msg.style.color = "green";

        setTimeout(() => {
            window.location.href = "/Users/Dashboard.html";
        }, 2000);
    } catch (error) {
        msg.textContent = error.message;
        msg.style.color = "red";
    }
}

async function registerVendor(event) {
    event.preventDefault();

    let role = "Vendor";
    let businessName = document.getElementById("vendor-register-name").value.trim();
    let address = document.getElementById("vendor-register-address").value.trim();
    let email = document.getElementById("vendor-register-email").value.trim();
    let password = document.getElementById("vendor-register-password").value.trim();
    let msg = document.getElementById("vendorMsg");

    try {
        let userCredential = await createUserWithEmailAndPassword(auth, email, password);
        let vendor = userCredential.user;

        await setDoc(doc(db, "vendors", vendor.uid), { email, role, businessName, address });

        msg.textContent = "Registration Successful.";
        msg.style.color = "green";

        setTimeout(() => {
            window.location.href = "/Vendors/Dashboard.html";
        }, 2000);
    } catch (error) {
        msg.textContent = error.message;
        msg.style.color = "red";
    }
}

async function signIn(event) {
    event.preventDefault();

    let email = document.getElementById("signIn-email").value.trim();
    let password = document.getElementById("signIn-password").value.trim();
    let msg = document.getElementById("authMsg");

    try {
        let userCredential = await signInWithEmailAndPassword(auth, email, password);
        let user = userCredential.user;

        let userDoc = await getDoc(doc(db, "users", user.uid));
        let vendorDoc = await getDoc(doc(db, "vendors", user.uid));

        if (userDoc.exists()) {
            window.location.href = "/Users/Dashboard.html";
        }
        else if (vendorDoc.exists()) {
            window.location.href = "/Vendors/Dashboard.html";
        }
        else {
            msg.textContent = "No profile found. Please register again.";
            msg.style.color = "red";
        }
    } catch (error) {
        msg.textContent = error.message;
        msg.style.color = "red";
    }
}
