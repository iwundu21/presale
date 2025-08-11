
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as admin from 'firebase-admin';

// This line ensures .env variables are available server-side.
require('dotenv').config({ path: '.env' });

// --- Firebase Admin SDK (Server-side) ---

let firestoreAdmin: admin.firestore.Firestore;

function getFirestoreAdmin() {
    if (firestoreAdmin) {
        return firestoreAdmin;
    }

    // Check if the admin app is already initialized
    if (admin.apps.length === 0) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
        if (!serviceAccountKey) {
            // This case should ideally not be hit if .env is configured correctly
            console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side Firebase services will fail.");
        } else {
            try {
                const serviceAccount = JSON.parse(serviceAccountKey);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            } catch (e: any) {
                console.error("Failed to parse Firebase service account key. Ensure it's a valid JSON string.", e);
            }
        }
    }
    
    firestoreAdmin = admin.firestore();
    return firestoreAdmin;
}

// Export a getter function instead of the instance itself
export { getFirestoreAdmin };


// --- Firebase Client SDK (Client-side) ---

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
