
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { passcode } = await request.json();
        
        const passcodeConfig = await prisma.config.findUnique({
            where: { key: 'adminPasscode' }
        });

        const correctPasscode = passcodeConfig ? String(passcodeConfig.value) : process.env.ADMIN_PASSCODE || '203020';
        
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
