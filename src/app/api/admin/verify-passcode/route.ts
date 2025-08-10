
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getAdminPasscode(): Promise<string | null> {
    try {
        const config = await prisma.config.findUnique({
            where: { key: 'adminPasscode' }
        });
        // Fallback to env var, but also allow a default for first-time setup
        return config ? config.value : (process.env.ADMIN_PASSCODE || '203020');
    } catch (error) {
        console.error("Prisma error fetching admin passcode:", error);
        // If DB is not available, fallback to env or default
        return process.env.ADMIN_PASSCODE || '203020';
    }
}


export async function POST(request: NextRequest) {
    try {
        const { passcode } = await request.json();
        const correctPasscode = await getAdminPasscode();
        
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
