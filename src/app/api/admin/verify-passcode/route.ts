
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const verifyPasscodeSchema = z.object({
    passcode: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { passcode } = verifyPasscodeSchema.parse(body);
        
        // Use the hardcoded default passcode directly to ensure access.
        // The database check was causing a lock-out if the DB value was unknown.
        const correctPasscode = process.env.ADMIN_PASSCODE || '203040';
        
        if (passcode === correctPasscode) {
            return NextResponse.json({ message: 'Verification successful' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Incorrect passcode.' }, { status: 401 });
        }

    } catch (error: any) {
        console.error('API Verify-Passcode Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input.', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'An internal server error occurred during verification.' }, { status: 500 });
    }
}
