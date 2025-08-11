
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as admin from 'firebase-admin';

require('dotenv').config({ path: '.env' });

// --- Firebase Admin SDK (Server-side) ---

const initializeAdminApp = () => {
    // If the app is already initialized, return it.
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    // Otherwise, initialize a new one.
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your .env file.");
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (e: any) {
        console.error("Failed to parse Firebase service account key. Ensure it's a valid JSON string.", e);
        throw new Error(`Failed to initialize Firebase Admin SDK. Original error: ${e.message}`);
    }
};


let firestoreAdminInstance: admin.firestore.Firestore;

// Getter function for the admin firestore instance
const getFirestoreAdmin = () => {
    if (!firestoreAdminInstance) {
        initializeAdminApp();
        firestoreAdminInstance = admin.firestore();
    }
    return firestoreAdminInstance;
};

// Export the singleton instance
export const firestoreAdmin = getFirestoreAdmin();


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
