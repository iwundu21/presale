
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-pZAeLCMvXBSKZT7ucVu554Ne9w4kYYw",
  authDomain: "exnus-presale.firebaseapp.com",
  projectId: "exnus-presale",
  storageBucket: "exnus-presale.appspot.com",
  messagingSenderId: "47975573131",
  appId: "1:47975573131:web:98553752e317400a8b168e"
};


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db = getFirestore(app);

export { app, db };
