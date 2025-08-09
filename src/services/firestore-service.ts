'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import type { Transaction as AppTransaction } from '@/components/dashboard-client-provider';

// Firestore document paths
const USERS_COLLECTION = 'users';
const TRANSACTIONS_SUBCOLLECTION = 'transactions';
const PRESALE_STATS_DOC = 'presale/stats';

// Types
export interface UserData {
  exnBalance: number;
  walletAddress: string;
}

export interface PresaleStats {
  totalExnSold: number;
  totalRaised: number; // in USD
}

/**
 * Retrieves user data from Firestore.
 * If the user doesn't exist, it creates a new record.
 */
export async function getUserData(userId: string): Promise<UserData> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserData;
  } else {
    const newUser: UserData = { exnBalance: 0, walletAddress: userId };
    await setDoc(userRef, newUser);
    return newUser;
  }
}

/**
 * Retrieves the latest transactions for a user.
 */
export async function getTransactions(userId: string): Promise<AppTransaction[]> {
    const txsRef = collection(db, USERS_COLLECTION, userId, TRANSACTIONS_SUBCOLLECTION);
    const q = query(txsRef, orderBy('date', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            date: (data.date as Timestamp).toDate(),
        } as AppTransaction;
    });
}


/**
 * Retrieves presale statistics from Firestore.
 */
export async function getPresaleStats(): Promise<PresaleStats> {
  const statsRef = doc(db, PRESALE_STATS_DOC);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    return statsSnap.data() as PresaleStats;
  } else {
    // Return default stats if the document doesn't exist
    return { totalExnSold: 0, totalRaised: 0 };
  }
}

/**
 * Records a purchase transaction in Firestore, updating user balance and presale totals atomically.
 */
export async function recordPurchase(
  userId: string,
  tx: Omit<AppTransaction, 'status' | 'date'>,
  signature: string
): Promise<void> {

   const userRef = doc(db, USERS_COLLECTION, userId);
   const statsRef = doc(db, PRESALE_STATS_DOC);
   const txRef = doc(collection(db, USERS_COLLECTION, userId, TRANSACTIONS_SUBCOLLECTION), signature);

   await runTransaction(db, async (transaction) => {
        const [userDoc, statsDoc] = await Promise.all([
            transaction.get(userRef),
            transaction.get(statsRef)
        ]);
        
        // 1. Update User Balance
        if (!userDoc.exists()) {
            transaction.set(userRef, { 
                exnBalance: tx.amountExn,
                walletAddress: userId
            });
        } else {
            const newBalance = (userDoc.data().exnBalance || 0) + tx.amountExn;
            transaction.update(userRef, { exnBalance: newBalance });
        }
        
        // 2. Update Presale Stats
        if (!statsDoc.exists()) {
            transaction.set(statsRef, {
                totalExnSold: tx.amountExn,
            });
        } else {
            const newTotalSold = (statsDoc.data().totalExnSold || 0) + tx.amountExn;
            transaction.update(statsRef, { totalExnSold: newTotalSold });
        }

        // 3. Record the transaction
        transaction.set(txRef, {
            ...tx,
            status: 'Completed',
            date: serverTimestamp()
        });
   });
}
