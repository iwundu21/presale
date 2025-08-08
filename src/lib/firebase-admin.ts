import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        if (!serviceAccountJson) {
            throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.');
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    } catch (e: any) {
        console.error("Failed to initialize firebase-admin", e.message)
    }
}

const adminDb = admin.firestore();

export { adminDb };
