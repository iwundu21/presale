
import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebase';

const defaultPresaleInfo = { seasonName: "Early Stage", tokenPrice: 0.09 };

export async function GET() {
    try {
        const firestoreAdmin = getFirestoreAdmin();
        const usersSnapshot = await firestoreAdmin.collection('users').get();
        let totalExnSold = 0;
        usersSnapshot.forEach(doc => {
            totalExnSold += doc.data().balance || 0;
        });
        
        const configRef = firestoreAdmin.collection('config');
        const presaleInfoDocRef = configRef.doc('presaleInfo');
        const isPresaleActiveDocRef = configRef.doc('isPresaleActive');

        let presaleInfoDoc = await presaleInfoDocRef.get();
        let isPresaleActiveDoc = await isPresaleActiveDocRef.get();

        let presaleInfo, isPresaleActive;

        if (!presaleInfoDoc.exists) {
            await presaleInfoDocRef.set(defaultPresaleInfo);
            presaleInfo = defaultPresaleInfo;
        } else {
            presaleInfo = presaleInfoDoc.data();
        }

        if (!isPresaleActiveDoc.exists) {
            await isPresaleActiveDocRef.set({ value: true });
            isPresaleActive = true;
        } else {
            isPresaleActive = isPresaleActiveDoc.data()?.value;
        }


        return NextResponse.json({ 
            totalExnSold,
            presaleInfo,
            isPresaleActive,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Data Error:', error);
        // This is a fallback in case of a critical error like Firestore service being down.
        return NextResponse.json({
            totalExnSold: 0,
            presaleInfo: defaultPresaleInfo,
            isPresaleActive: true,
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
     try {
        const firestoreAdmin = getFirestoreAdmin();
        const { presaleInfo, isPresaleActive } = await request.json();
        
        const configRef = firestoreAdmin.collection('config');

        if (presaleInfo) {
            if (!presaleInfo.seasonName || typeof presaleInfo.tokenPrice !== 'number') {
                 return NextResponse.json({ message: 'Invalid input for presale info' }, { status: 400 });
            }
            await configRef.doc('presaleInfo').set(presaleInfo);
        }

        if (typeof isPresaleActive === 'boolean') {
             await configRef.doc('isPresaleActive').set({ value: isPresaleActive });
        }

        const updatedPresaleInfoDoc = await configRef.doc('presaleInfo').get();
        const updatedIsPresaleActiveDoc = await configRef.doc('isPresaleActive').get();
        
        const updatedInfo = updatedPresaleInfoDoc.exists() && updatedPresaleInfoDoc.data() ? updatedPresaleInfoDoc.data() : defaultPresaleInfo;
        const updatedStatus = updatedIsPresaleActiveDoc.exists() && updatedIsPresaleActiveDoc.data()?.value !== undefined ? updatedIsPresaleActiveDoc.data()?.value : true;


        return NextResponse.json({ 
            message: 'Presale data updated successfully',
            presaleInfo: updatedInfo,
            isPresaleActive: updatedStatus,
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Presale-Data POST Error:', error);
        if (error.message.includes('Invalid input')) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
