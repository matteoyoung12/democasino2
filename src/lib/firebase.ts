
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "studio-5422558187-9cb0a",
  appId: "1:32584903617:web:169d11286b7031a540dd40",
  apiKey: "AIzaSyBWI_p1rd_9WZSpnC8YSIXCmA193Jb_xVs",
  authDomain: "studio-5422558187-9cb0a.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "32584903617"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
