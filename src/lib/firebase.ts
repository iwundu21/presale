// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-pZAeLCMvXBSKZT7ucVu554Ne9w4kYYw",
  authDomain: "exnus-presale.firebaseapp.com",
  projectId: "exnus-presale",
  storageBucket: "exnus-presale.firebasestorage.app",
  messagingSenderId: "47975573131",
  appId: "1:47975573131:web:98553752e317400a8b168e"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
