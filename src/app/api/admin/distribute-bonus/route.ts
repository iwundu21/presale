
import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const firestoreAdmin = getFirestoreAdmin();
        const configRef = firestoreAdmin.collection('config').doc('bonusDistributed');
        const bonusConfig = await configRef.get();

        if (bonusConfig.exists && bonusConfig.data()?.value === true) {
            return NextResponse.json({ message: 'Bonus has already been distributed.' }, { status: 400 });
        }
        
        const usersToUpdateSnapshot = await firestoreAdmin.collection('users').where('balance', '>', 0).get();

        if (usersToUpdateSnapshot.empty) {
             return NextResponse.json({ 
                message: `No users with a balance to distribute bonus to.`,
                updatedCount: 0 
            }, { status: 200 });
        }
        
        let updatedCount = 0;
        const batch = firestoreAdmin.batch();
        
        for (const userDoc of usersToUpdateSnapshot.docs) {
            const user = userDoc.data();
            const bonusAmount = user.balance * 0.03;
            const newBalance = user.balance + bonusAmount;
            
            batch.update(userDoc.ref, { balance: newBalance });
            
            const newTxRef = userDoc.ref.collection('transactions').doc(`bonus-${uuidv4()}`);
            batch.set(newTxRef, {
                amountExn: bonusAmount,
                paidAmount: 0,
                paidCurrency: 'BONUS',
                date: new Date(),
                status: 'Completed',
                failureReason: 'Presale Bonus',
                balanceAdded: true
            });
            updatedCount++;
        }

        await batch.commit();

        await configRef.set({ value: true });

        return NextResponse.json({ 
            message: `Successfully distributed 3% bonus to ${updatedCount} users.`,
            updatedCount: updatedCount 
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Distribute-Bonus Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const firestoreAdmin = getFirestoreAdmin();
        const configRef = firestoreAdmin.collection('config').doc('bonusDistributed');
        const bonusConfig = await configRef.get();
        
        return NextResponse.json({ isBonusDistributed: bonusConfig.exists && bonusConfig.data()?.value === true }, { status: 200 });
    } catch (error) {
        console.error('API Distribute-Bonus GET Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
