'use server';

import { getFirebaseInstances } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import type { Transaction } from '@/components/dashboard-client-provider';

const USERS_COLLECTION = 'users';
const TRANSACTIONS_SUBCOLLECTION = 'transactions';


/**
 * Saves a transaction record for a specific user in Firestore.
 * @param userId The user's public wallet address.
 * @param transaction The transaction object to save.
 */
export async function saveTransaction(userId: string, transaction: Transaction): Promise<void> {
  try {
    const { db } = getFirebaseInstances();
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const transactionsColRef = collection(userDocRef, TRANSACTIONS_SUBCOLLECTION);
    const transactionDocRef = doc(transactionsColRef, transaction.id);

    // Convert Date to Firestore Timestamp for proper querying
    const transactionForDb = {
        ...transaction,
        date: Timestamp.fromDate(transaction.date)
    };
    
    await setDoc(transactionDocRef, transactionForDb, { merge: true });
  } catch (error) {
    console.error(`Failed to save transaction ${transaction.id} for user ${userId}:`, error);
    throw new Error('Could not save transaction to the database.');
  }
}

/**
 * Retrieves all transaction records for a specific user from Firestore.
 * @param userId The user's public wallet address.
 * @returns A promise that resolves to an array of transactions.
 */
export async function getTransactions(userId: string): Promise<Transaction[]> {
    try {
        const { db } = getFirebaseInstances();
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const transactionsColRef = collection(userDocRef, TRANSACTIONS_SUBCOLLECTION);
        // Order by date descending to get the newest transactions first
        const q = query(transactionsColRef, orderBy('date', 'desc'));
        
        const querySnapshot = await getDocs(q);

        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({
                ...data,
                // Convert Firestore Timestamp back to JavaScript Date object
                date: (data.date as Timestamp).toDate(),
            } as Transaction);
        });

        return transactions;

    } catch (error) {
        console.error(`Failed to get transactions for user ${userId}:`, error);
        // Return an empty array on error so the UI doesn't break
        return [];
    }
}
