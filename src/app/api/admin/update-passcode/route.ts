
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function POST(request: NextRequest) {
    try {
        const { currentPasscode, newPasscode } = await request.json();
        
        if (!currentPasscode || !newPasscode) {
            return NextResponse.json({ message: 'Current and new passcodes are required.' }, { status: 400 });
        }

        const correctPasscode = await db.getAdminPasscode();

        if (!correctPasscode) {
             return NextResponse.json({ message: 'Admin passcode is not configured.' }, { status: 500 });
        }

        if (currentPasscode !== correctPasscode) {
             return NextResponse.json({ message: 'Incorrect current passcode.' }, { status: 403 });
        }
        
        await db.setAdminPasscode(newPasscode);

        return NextResponse.json({ message: 'Passcode updated successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Passcode Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
