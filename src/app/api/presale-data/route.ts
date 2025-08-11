
import { NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase';

const defaultPresaleInfo = { seasonName: "Early Stage", tokenPrice: 0.09 };

export async function GET() {
    try {
        const usersSnapshot = await firestoreAdmin.collection('users').get();
        let totalExnSold = 0;
        usersSnapshot.forEach(doc => {
            totalExnSold += doc.data().balance || 0;
        });
        
        const configRef = firestoreAdmin.collection('config');
        const presaleInfoDoc = await configRef.doc('presaleInfo').get();
        const isPresaleActiveDoc = await configRef.doc('isPresaleActive').get();

        const presaleInfo = presaleInfoDoc.exists && presaleInfoDoc.data() ? presaleInfoDoc.data() : defaultPresaleInfo;
        const isPresaleActive = isPresaleActiveDoc.exists && isPresaleActiveDoc.data()?.value !== undefined ? isPresaleActiveDoc.data()?.value : true;

        return NextResponse.json({ 
            totalExnSold,
            presaleInfo,
            isPresaleActive,
        }, { status: 200 });
    } catch (error) {
        console.error('API Presale-Data Error:', error);
        // Fallback to default data in case of a more critical Firestore error.
        return NextResponse.json({
            totalExnSold: 0,
            presaleInfo: defaultPresaleInfo,
            isPresaleActive: true,
        }, { status: 200 });
    }
}

export async function POST(request: Request) {
     try {
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
