
import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebase';
import type { Transaction } from '@/components/dashboard-client-provider';

type UserAdminView = {
    wallet: string;
    balance: number;
    transactions: Transaction[];
}

export async function GET(request: NextRequest) {
    try {
        const firestoreAdmin = getFirestoreAdmin();
        const { searchParams } = new URL(request.url);
        let page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || '10', 10);
        const searchQuery = searchParams.get('searchQuery')?.toLowerCase() || '';

        let usersQuery = firestoreAdmin.collection('users');

        // Note: Firestore doesn't support case-insensitive 'contains' queries directly.
        // For a large-scale app, a search service like Algolia or a different data structure would be needed.
        // For this app, we will fetch all and filter in memory if a search query is provided.
        if (searchQuery) {
            limit = 0; // fetch all to filter
        }

        const snapshot = await usersQuery.orderBy('balance', 'desc').get();
        let usersData: UserAdminView[] = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const transactionsSnapshot = await doc.ref.collection('transactions').orderBy('date', 'desc').get();
            const transactions = transactionsSnapshot.docs.map(txDoc => {
                const txData = txDoc.data();
                return {
                    ...txData,
                    id: txDoc.id,
                    date: txData.date.toDate(),
                } as Transaction;
            });

            usersData.push({
                wallet: doc.id,
                balance: userData.balance,
                transactions,
            });
        }
        
        let filteredUsers = usersData;
        if(searchQuery) {
            filteredUsers = usersData.filter(u => u.wallet.toLowerCase().includes(searchQuery));
        }
        
        const totalUsers = filteredUsers.length;
        const pagedUsers = limit > 0 ? filteredUsers.slice((page - 1) * limit, page * limit) : filteredUsers;

        return NextResponse.json({
            users: pagedUsers,
            total: totalUsers,
            page,
            totalPages: limit > 0 ? Math.ceil(totalUsers / limit) : 1
        }, { status: 200 });

    } catch (error) {
        console.error('API All-Users Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
