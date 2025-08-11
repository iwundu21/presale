
import { NextRequest, NextResponse } from 'next/server';
import { firestoreAdmin } from '@/lib/firebase';

export async function POST(request: NextRequest) {
    try {
        const { currentPasscode, newPasscode } = await request.json();
        
        if (!currentPasscode || !newPasscode) {
            return NextResponse.json({ message: 'Current and new passcodes are required.' }, { status: 400 });
        }
        
        const passcodeRef = firestoreAdmin.collection('config').doc('adminPasscode');
        const passcodeDoc = await passcodeRef.get();

        let correctPasscode = process.env.ADMIN_PASSCODE || '203020';
        if (passcodeDoc.exists) {
            correctPasscode = passcodeDoc.data()?.value;
        }

        if (currentPasscode !== correctPasscode) {
             return NextResponse.json({ message: 'Incorrect current passcode.' }, { status: 403 });
        }
        
        await passcodeRef.set({ value: newPasscode });

        return NextResponse.json({ message: 'Passcode updated successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Passcode Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
