import { auth, db } from "../firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { showToast } from "../script.js";

document.addEventListener("DOMContentLoaded", () => {
  let userForm = document.getElementById("user-register-form");
  let vendorForm = document.getElementById("vendor-register-form");
  let signInForm = document.getElementById("signIn-form");
  let showRolePopup = document.getElementById("showRolePopup");
  let rolePopup = document.getElementById("role-popup");
  let closePopup = document.getElementById("closePopup");
  let toggleBtn = document.getElementById("toggle-password");
  let passwordInput = document.getElementById("signIn-password");
  let showIcon = document.getElementById("show-pass");
  let hideIcon = document.getElementById("hide-pass");
  let googleSignInUser = document.getElementById("googleSignInUser");
  let googleSignInVendor = document.getElementById("googleSignInVendor");

  if (userForm) userForm.addEventListener("submit", registerUser);
  if (vendorForm) vendorForm.addEventListener("submit", registerVendor);
  if (signInForm) signInForm.addEventListener("submit", signIn);
  if (googleSignInUser) {
    googleSignInUser.addEventListener("click", () => signInWithGoogle("User"));
  }
  if (googleSignInVendor) {
    googleSignInVendor.addEventListener("click", () =>
      signInWithGoogle("Vendor")
    );
  }

  if (toggleBtn)
    toggleBtn.addEventListener("click", () => {
      let isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      showIcon.classList.toggle("hidden", !isPassword);
      hideIcon.classList.toggle("hidden", isPassword);
    });

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

  window.redirectToRegister = (role) => {
    if (role === "user") {
      window.location.href = "/Auth/userSignUp.html";
    } else if (role === "vendor") {
      window.location.href = "/Auth/vendorSignUp.html";
    }
  };
});

async function registerUser(event) {
  event.preventDefault();

  let role = "User";
  let name = document.getElementById("user-register-name").value.trim();
  let email = document.getElementById("user-register-email").value.trim();
  let password = document.getElementById("user-register-password").value.trim();
  let msg = document.getElementById("userMsg");

  let genderInput = document.querySelector('input[name="gender"]:checked');
  let gender = genderInput
    ? genderInput.nextElementSibling.textContent.trim()
    : "";

  if (!gender) {
    msg.textContent = "Please select your gender.";
    msg.style.color = "red";
    return;
  }

  try {
    let userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    let user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), { email, role, name, gender });

    localStorage.setItem("Registered", "true");

    await signOut(auth);
    showToast("Registration Successful. Redirecting to sign in...");

    setTimeout(() => {
      localStorage.removeItem("Registered");
      window.location.replace("/Auth/signIn.html");
    }, 1500);
  } catch (error) {
    msg.textContent = error.message;
    msg.style.color = "red";
  }
}

async function registerVendor(event) {
  event.preventDefault();

  let role = "Vendor";
  let businessName = document
    .getElementById("vendor-register-name")
    .value.trim();
  let address = document.getElementById("vendor-register-address").value.trim();
  let email = document.getElementById("vendor-register-email").value.trim();
  let password = document
    .getElementById("vendor-register-password")
    .value.trim();
  let msg = document.getElementById("vendorMsg");

  try {
    let userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    let vendor = userCredential.user;

    await setDoc(doc(db, "vendors", vendor.uid), {
      email,
      role,
      businessName,
      address,
    });

    localStorage.setItem("Registered", "true");

    await signOut(auth);
    showToast("Registration Successful. Redirecting to sign in...");

    setTimeout(() => {
      localStorage.removeItem("Registered");
      window.location.replace("/Auth/signIn.html");
    }, 1500);
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
    let userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    let user = userCredential.user;

    let userDoc = await getDoc(doc(db, "users", user.uid));
    let vendorDoc = await getDoc(doc(db, "vendors", user.uid));

    if (userDoc.exists()) {
      window.location.href = "/User/Dashboard.html";
    } else if (vendorDoc.exists()) {
      window.location.href = "/Vendor/Dashboard.html";
    } else {
      msg.textContent = "No profile found. Please register again.";
      msg.style.color = "red";
    }
  } catch (error) {
    msg.textContent = error.message;
    msg.style.color = "red";
  }
}

async function signInWithGoogle(role) {
  let provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });
  let msg = document.getElementById("authMsg");

  try {
    let result = await signInWithPopup(auth, provider);
    let user = result.user;

    let userRef = doc(db, "users", user.uid);
    let vendorRef = doc(db, "vendors", user.uid);

    let [userDoc, vendorDoc] = await Promise.all([
      getDoc(userRef),
      getDoc(vendorRef),
    ]);

    if (userDoc.exists()) {
      showToast("Logged in as existing User.");
      setTimeout(() => {
        window.location.href = "/User/Dashboard.html";
      }, 1500);
      return;
    }
    if (vendorDoc.exists()) {
      showToast("Logged in as existing Vendor.");
      setTimeout(() => {
        window.location.href = "/Vendor/Dashboard.html";
      }, 1500);
      return;
    }

    if (role === "User") {
      let gender = prompt("Please add your gender (Male/Female):", "Male");
      gender = gender.trim();

      if(!gender || !["Male", "Female", "Other"].includes(gender)) {
        showToast("Invalid or missing gender.", true);
        return;
      }
      await setDoc(userRef, {
        email: user.email,
        name: user.displayName || "Google User",
        role,
        gender,
      });
      showToast("Signed in with Google as User.");
      setTimeout(() => {
        window.location.href = "/User/Dashboard.html";
      }, 1500);
    } else {
      let businessName = prompt("Enter your Business Name: ");
      let address = prompt("Enter your Business Address: ");

      if (!businessName?.trim() && !address?.trim()) {
        showToast("business name and address are required.", true);
        return;
      }
      await setDoc(vendorRef, {
        email: user.email,
        businessName: businessName.trim(),
        address: address.trim(),
        role,
      });
      showToast("Signed in with Google as Vendor.");
      setTimeout(() => {
        window.location.href = "/Vendor/Dashboard.html";
      }, 1500);
    }
  } catch (error) {
    msg.textContent = "Google Sign-in Error: " + error.message;
    msg.style.color = "red";
  }
}

onAuthStateChanged(auth, async (user) => {
  let registered = localStorage.getItem("Registered");

  if (registered === "true") {
    showToast("Skipping redirect due to recent registration");
    return;
  }

  let path = window.location.pathname;

  if (user) {
    let userDoc = await getDoc(doc(db, "users", user.uid));
    let vendorDoc = await getDoc(doc(db, "vendors", user.uid));

    if (
      path === "/Auth/signIn.html" ||
      path === "/Auth/userSignUp.html" ||
      path === "/Auth/vendorSignUp.html"
    ) {
      if (userDoc.exists()) window.location.href = "/User/Dashboard.html";
      else if (vendorDoc.exists())
        window.location.href = "/Vendor/Dashboard.html";
    }
  } else {
    if (path === "/User/Dashboard.html" || path === "/Vendor/Dashboard.html") {
      window.location.href = "/Auth/signIn.html";
    }
  }
});
