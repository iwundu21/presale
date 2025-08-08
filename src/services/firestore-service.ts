'use server';

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, orderBy, query, Timestamp, getDoc } from 'firebase/firestore';
import type { Transaction } from '@/components/dashboard-client-provider';

const USERS_COLLECTION = 'users';
const TRANSACTIONS_SUBCOLLECTION = 'transactions';

export type UserData = {
    walletAddress: string;
    exnBalance: number;
    updatedAt: Timestamp;
};

/**
 * Creates or updates a user's main data document in Firestore.
 * This is called after a successful transaction to ensure the balance is up to date.
 * @param userId The user's public wallet address.
 * @param exnBalance The user's new total EXN balance.
 */
export async function updateUserBalance(userId: string, exnBalance: number): Promise<void> {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const userData: UserData = {
            walletAddress: userId,
            exnBalance: exnBalance,
            updatedAt: Timestamp.now()
        };
        await setDoc(userDocRef, userData, { merge: true });
    } catch (error) {
        console.error(`Failed to update balance for user ${userId}:`, error);
        throw new Error('Could not update user balance in the database.');
    }
}

/**
 * Retrieves a user's data document from Firestore.
 * @param userId The user's public wallet address.
 * @returns The user's data or null if not found.
 */
export async function getUser(userId: string): Promise<UserData | null> {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    } catch (error) {
        console.error(`Failed to get user ${userId}:`, error);
        return null;
    }
}


/**
 * Saves a transaction record for a specific user in Firestore.
 * @param userId The user's public wallet address.
 * @param transaction The transaction object to save.
 */
export async function saveTransaction(userId: string, transaction: Transaction): Promise<void> {
  try {
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


/**
 * Retrieves all user documents from the users collection.
 * Intended for admin use.
 * @returns A promise that resolves to an array of user data.
 */
export async function getAllUsers(): Promise<UserData[]> {
    try {
        const usersColRef = collection(db, USERS_COLLECTION);
        const q = query(usersColRef, orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const users: UserData[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as UserData);
        });

        return users;
    } catch (error) {
        console.error("Failed to get all users:", error);
        return [];
    }
}