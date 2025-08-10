
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function POST(request: NextRequest) {
    try {
        const { passcode } = await request.json();
        const correctPasscode = await db.getAdminPasscode();
        
        if (!correctPasscode) {
            console.error("FATAL: Admin passcode is not set in DB, environment, or as a default.");
            return NextResponse.json({ message: 'Server configuration error: No passcode set.' }, { status: 500 });
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
