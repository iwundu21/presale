
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as admin from 'firebase-admin';

// --- Firebase Admin SDK (Server-side) ---

const initializeAdminApp = () => {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
    }
    
    // Check if the app is already initialized
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (e: any) {
        // Throw a more informative error
        throw new Error(`Failed to initialize Firebase Admin SDK. Please ensure your FIREBASE_SERVICE_ACCOUNT_KEY is set correctly in your .env file. Original error: ${e.message}`);
    }
};

// A getter for the firestoreAdmin instance.
// This ensures initializeAdminApp() is called before firestore is accessed.
const getFirestoreAdmin = () => {
    initializeAdminApp();
    return admin.firestore();
};

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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
