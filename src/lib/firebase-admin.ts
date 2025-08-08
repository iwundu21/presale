
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

if (!admin.apps.length) {
    try {
        const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        if (!serviceAccountJson) {
            throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set or is empty. This is required for server-side Firebase operations.');
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
        
        adminDb = admin.firestore();

    } catch (e: any) {
        console.error("CRITICAL: Failed to initialize firebase-admin. This will cause server-side data fetching to fail.", e);
        // Re-throw the error to prevent the app from starting in a broken state
        // This makes it clear that the environment is not configured correctly.
        throw new Error(`Firebase admin initialization failed: ${e.message}`);
    }
} else {
    // If the app is already initialized, just get the firestore instance
    adminDb = admin.app().firestore();
}


export { adminDb };
