import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

try {
  // Check if the default app is already initialized
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  adminDb = admin.firestore();
} catch (error: any) {
  console.error('Firebase admin initialization error', error.stack);
}

export { adminDb };
