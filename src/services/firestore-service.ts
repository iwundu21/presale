
'use server';

import { collection, doc, getDoc, getDocs, setDoc, Timestamp, runTransaction, increment, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/components/dashboard-client-provider";

const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';
const PRESALE_STATS_COLLECTION = 'presaleStats';
const TOTALS_DOC = 'totals';

// Type for user data stored in Firestore
export type UserData = {
    walletAddress: string;
    exnBalance: number;
};

// Type for presale stats
export type PresaleStats = {
    totalExnSold: number;
}


// --- User Management ---

export async function getUser(walletAddress: string): Promise<UserData | null> {
    try {
        const docRef = doc(db, USERS_COLLECTION, walletAddress);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    } catch (error) {
        console.error("Error getting user:", error);
        return null;
    }
}

export async function createUserIfNotExist(walletAddress: string): Promise<UserData> {
    const userDocRef = doc(db, USERS_COLLECTION, walletAddress);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data() as UserData;
    } else {
        const newUser: UserData = {
            walletAddress,
            exnBalance: 0,
        };
        await setDoc(userDocRef, newUser);
        return newUser;
    }
}


export async function updateUser(walletAddress: string, data: Partial<UserData>): Promise<void> {
    try {
        const docRef = doc(db, USERS_COLLECTION, walletAddress);
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating user:", error);
        throw new Error("Could not update user data.");
    }
}

export async function updateUserBalanceAndTotals(walletAddress: string, newBalance: number): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, walletAddress);
    const statsDocRef = doc(db, PRESALE_STATS_COLLECTION, TOTALS_DOC);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("User document does not exist!");
            }

            const oldBalance = userDoc.data().exnBalance || 0;
            const balanceDifference = newBalance - oldBalance;

            // Update user's balance
            transaction.set(userDocRef, { exnBalance: newBalance }, { merge: true });

            // Update total EXN sold
            transaction.set(statsDocRef, {
                totalExnSold: increment(balanceDifference)
            }, { merge: true });
        });
    } catch (error) {
        console.error("Error updating user balance and totals:", error);
        throw new Error("Could not update user balance and totals.");
    }
}


export async function getAllUsers(): Promise<UserData[]> {
    try {
        const usersCollection = collection(db, USERS_COLLECTION);
        const querySnapshot = await getDocs(usersCollection);
        const users: UserData[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure walletAddress is included, using the document ID as the wallet address
            users.push({
                walletAddress: doc.id,
                exnBalance: data.exnBalance || 0,
            });
        });
        return users;
    } catch (error) {
        console.error("Error getting all users:", error);
        throw new Error("Could not fetch user list.");
    }
}


// --- Transaction Management ---

// Converts Firestore Timestamps to JS Dates in a transaction object
const convertTimestampsToDates = (tx: any): Transaction => {
    return {
        ...tx,
        date: tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date),
    };
};

export async function saveTransaction(walletAddress: string, transaction: Transaction): Promise<void> {
    try {
        const docRef = doc(db, USERS_COLLECTION, walletAddress, TRANSACTIONS_COLLECTION, transaction.id);
        await setDoc(docRef, transaction);
    } catch (error) {
        console.error("Error saving transaction:", error);
        throw new Error("Could not save transaction to the database.");
    }
}

export async function deleteTransaction(walletAddress: string, transactionId: string): Promise<void> {
    try {
        const docRef = doc(db, USERS_COLLECTION, walletAddress, TRANSACTIONS_COLLECTION, transactionId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting transaction:", error);
        throw new Error("Could not delete transaction from the database.");
    }
}

export async function getTransactions(walletAddress: string): Promise<Transaction[]> {
    try {
        const transactionsCol = collection(db, USERS_COLLECTION, walletAddress, TRANSACTIONS_COLLECTION);
        const querySnapshot = await getDocs(transactionsCol);
        const transactions = querySnapshot.docs
            .map(doc => convertTimestampsToDates(doc.data() as Transaction))
            .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by most recent
        return transactions;
    } catch (error) {
        console.error("Error getting transactions:", error);
        return [];
    }
}


// --- Presale Stats & Settings Management ---

export async function getPresaleStats(): Promise<PresaleStats> {
    try {
        const docRef = doc(db, PRESALE_STATS_COLLECTION, TOTALS_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as PresaleStats;
        }
        // If it doesn't exist, initialize it
        const initialStats: PresaleStats = { totalExnSold: 0 };
        await setDoc(docRef, initialStats);
        return initialStats;
    } catch (error) {
        console.error("Error getting presale stats:", error);
        // Return a default object on error
        return { totalExnSold: 0 };
    }
}

/**
 * Listens for real-time updates on the presale stats document.
 * @param callback - A function to be called with the new stats data.
 * @returns An unsubscribe function to stop listening.
 */
export function listenToPresaleStats(callback: (stats: PresaleStats | null) => void): () => void {
  const docRef = doc(db, PRESALE_STATS_COLLECTION, TOTALS_DOC);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as PresaleStats);
    } else {
      // Document does not exist, maybe initialize it or handle the case
      const initialStats: PresaleStats = { totalExnSold: 0 };
      setDoc(docRef, initialStats).then(() => callback(initialStats));
    }
  }, (error) => {
    console.error("Error listening to presale stats:", error);
    callback(null);
  });

  return unsubscribe;
}


export async function processPurchaseAndUpdateTotals(
    walletAddress: string, 
    transaction: Transaction,
    newBalance: number
): Promise<void> {
    try {
        await runTransaction(db, async (tx) => {
            // 1. Update total EXN sold
            const statsDocRef = doc(db, PRESALE_STATS_COLLECTION, TOTALS_DOC);
            tx.set(statsDocRef, { 
                totalExnSold: increment(transaction.amountExn)
            }, { merge: true });

            // 2. Update user's balance
            const userDocRef = doc(db, USERS_COLLECTION, walletAddress);
            tx.set(userDocRef, { exnBalance: newBalance, walletAddress: walletAddress }, { merge: true });
            
            // 3. Save the transaction record for the user
            const txDocRef = doc(db, USERS_COLLECTION, walletAddress, TRANSACTIONS_COLLECTION, transaction.id);
            tx.set(txDocRef, transaction);
        });
    } catch (error) {
        console.error("Error processing atomic purchase update:", error);
        // This is a critical error, you might want to add more robust handling
        // For now, we'll throw to let the caller know it failed.
        throw new Error("Failed to finalize purchase in database.");
    }
}
