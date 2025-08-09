
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { passcode } = await request.json();
        
        const correctPasscode = process.env.ADMIN_PASSCODE;

        if (!correctPasscode) {
            console.error("ADMIN_PASSCODE environment variable is not set.");
            return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
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
