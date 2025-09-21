
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
        
        const configDoc = await prisma.config.findUnique({ where: { id: 'adminPasscode' } });

        let correctPasscode = process.env.ADMIN_PASSCODE || '203040';
        if (configDoc) {
             const docValue = (configDoc.value as { value?: string }).value;
             if (docValue) {
                correctPasscode = docValue;
             }
        }
        
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

