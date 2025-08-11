
import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const firestoreAdmin = getFirestoreAdmin();
        const { searchParams } = new URL(request.url);
        const userKey = searchParams.get('userKey');

        if (!userKey) {
            return NextResponse.json({ message: 'User key is required' }, { status: 400 });
        }
        
        const userRef = firestoreAdmin.collection('users').doc(userKey);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // If user does not exist, create a new document for them
            await userRef.set({ 
                wallet: userKey,
                balance: 0 
            });
            return NextResponse.json({
                balance: 0,
                transactions: []
            }, { status: 200 });
        }

        const transactionsSnapshot = await userRef.collection('transactions').orderBy('date', 'desc').get();
        const transactions = transactionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(), // Convert Firestore Timestamp to JS Date
            };
        });
        
        return NextResponse.json({
            balance: userDoc.data()?.balance || 0,
            transactions: transactions
        }, { status: 200 });

    } catch (error) {
        console.error('API User-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
