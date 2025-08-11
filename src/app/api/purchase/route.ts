
import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase';
import type { Transaction } from '@/components/dashboard-client-provider';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const { userKey, exnAmount, transaction } = await request.json() as { userKey: string; exnAmount: number; transaction: Transaction };

        if (!userKey || !transaction || !transaction.id) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }
        
        const userRef = firestoreAdmin.collection('users').doc(userKey);
        const txRef = userRef.collection('transactions').doc(transaction.id);

        const txData = {
            amountExn: transaction.amountExn,
            paidAmount: transaction.paidAmount,
            paidCurrency: transaction.paidCurrency,
            date: transaction.date, // Firestore will convert this to a Timestamp
            status: transaction.status,
            failureReason: transaction.failureReason || null,
            blockhash: transaction.blockhash || null,
            lastValidBlockHeight: transaction.lastValidBlockHeight || null,
            balanceAdded: transaction.status === 'Completed'
        };

        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            await userRef.set({ wallet: userKey, balance: 0 });
        }
        
        await txRef.set(txData, { merge: true });
        
        let newBalance = userDoc.data()?.balance || 0;

        if (transaction.status === 'Completed') {
            const txDoc = await txRef.get();
            // Ensure balance is only added once
            if (txDoc.exists && !txDoc.data()?.balanceAdded) {
                await userRef.update({ balance: FieldValue.increment(exnAmount) });
                await txRef.update({ balanceAdded: true });
                newBalance += exnAmount;
            }
        }
        
        const usersSnapshot = await firestoreAdmin.collection('users').get();
        let newTotalSold = 0;
        usersSnapshot.forEach(doc => {
            newTotalSold += doc.data().balance || 0;
        });

        const updatedTransactionsSnapshot = await userRef.collection('transactions').orderBy('date', 'desc').get();
        const updatedTransactions = updatedTransactionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(),
            };
        });

        return NextResponse.json({
            message: 'Purchase recorded',
            newBalance: newBalance,
            newTotalSold: newTotalSold,
            transactions: updatedTransactions,
        }, { status: 200 });

    } catch (error) {
        console.error('API Purchase Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
