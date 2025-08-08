
'use server';

import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/components/dashboard-client-provider";

const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'transactions';

// Type for user data stored in Firestore
export type UserData = {
    walletAddress: string;
    exnBalance: number;
};

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

export async function updateUser(walletAddress: string, data: Partial<UserData>): Promise<void> {
    try {
        const docRef = doc(db, USERS_COLLECTION, walletAddress);
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating user:", error);
        throw new Error("Could not update user data.");
    }
}

export async function getAllUsers(): Promise<UserData[]> {
    try {
        const usersCollection = collection(db, USERS_COLLECTION);
        const querySnapshot = await getDocs(usersCollection);
        const users: UserData[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as UserData);
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
