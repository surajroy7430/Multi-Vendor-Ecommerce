import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB8HUnlSVjOeG4pFQOgOv9LLjnDZwY8HgM",
    authDomain: "multi-vendor-e-commerce-e8445.firebaseapp.com",
    databaseURL: "https://multi-vendor-e-commerce-e8445-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "multi-vendor-e-commerce-e8445",
    storageBucket: "multi-vendor-e-commerce-e8445.firebasestorage.app",
    messagingSenderId: "434960484828",
    appId: "1:434960484828:web:f71b104c07f6eee257a719",
    measurementId: "G-212ECCXV50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);