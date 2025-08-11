
import { NextResponse } from 'next/server';
import { getFirestoreAdmin } from '@/lib/firebase';

const getDefaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
};

export async function GET() {
    try {
        const firestoreAdmin = getFirestoreAdmin();
        const docRef = firestoreAdmin.collection('config').doc('presaleEndDate');
        const doc = await docRef.get();
        let presaleEndDate;

        if (doc.exists) {
            presaleEndDate = doc.data()?.value;
        } else {
            // Document doesn't exist, so create it with a default value
            presaleEndDate = getDefaultEndDate();
            await docRef.set({ value: presaleEndDate });
        }
        
        return NextResponse.json({ presaleEndDate }, { status: 200 });
    } catch (error) {
        console.error('API Presale-Date GET Error:', error);
        // Fallback to a default value but still return a 200 OK
        // This prevents the client-side from throwing an error and allows the app to function
        const presaleEndDate = getDefaultEndDate();
        return NextResponse.json({ presaleEndDate }, { status: 200 });
    }
}

export async function POST(request: Request) {
     try {
        const firestoreAdmin = getFirestoreAdmin();
        const { presaleEndDate } = await request.json();

        if (!presaleEndDate || isNaN(new Date(presaleEndDate).getTime())) {
            return NextResponse.json({ message: 'Invalid date format provided.' }, { status: 400 });
        }
        
        await firestoreAdmin.collection('config').doc('presaleEndDate').set({ value: presaleEndDate });
        
        return NextResponse.json({ 
            message: 'Presale end date updated successfully',
            presaleEndDate,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Date POST Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
