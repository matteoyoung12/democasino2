// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWI_p1rd_9WZSpnC8YSIXCmA193Jb_xVs",
  authDomain: "studio-5422558187-9cb0a.firebaseapp.com",
  projectId: "studio-5422558187-9cb0a",
  storageBucket: "studio-5422558187-9cb0a.firebasestorage.app",
  messagingSenderId: "32584903617",
  appId: "1:32584903617:web:524484075845749940dd40"
};

// Initialize Firebase
let app;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };