// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWI_p1rd_9WZSpnC8YSIXCmA193Jb_xVs",
  authDomain: "studio-5422558187-9cb0a.firebaseapp.com",
  projectId: "studio-5422558187-9cb0a",
  storageBucket: "studio-5422558187-9cb0a.firebasestorage.app",
  messagingSenderId: "32584903617",
  appId: "1:32584903617:web:169d11286b7031a540dd40"
};

// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
