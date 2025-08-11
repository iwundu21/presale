
import { NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase';

export async function POST(request: NextRequest) {
    try {
        const { passcode } = await request.json();
        
        const passcodeRef = firestoreAdmin.collection('config').doc('adminPasscode');
        const passcodeDoc = await passcodeRef.get();

        let correctPasscode = process.env.ADMIN_PASSCODE || '203020';
        if (passcodeDoc.exists) {
            correctPasscode = passcodeDoc.data()?.value;
        }
        
        if (passcode === correctPasscode) {
            return NextResponse.json({ message: 'Verification successful' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Incorrect passcode.' }, { status: 401 });
        }

    } catch (error) {
        console.error('API Verify-Passcode Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
