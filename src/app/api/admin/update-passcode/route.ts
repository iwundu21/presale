
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updatePasscodeSchema = z.object({
    currentPasscode: z.string(),
    newPasscode: z.string().min(6),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { currentPasscode, newPasscode } = updatePasscodeSchema.parse(body);

        const configDoc = await prisma.config.findUnique({ where: { id: 'adminPasscode' } });

        let correctPasscode = process.env.ADMIN_PASSCODE || '203020';
        if (configDoc) {
            correctPasscode = (configDoc.value as { value: string }).value;
        }

        if (currentPasscode !== correctPasscode) {
             return NextResponse.json({ message: 'Incorrect current passcode.' }, { status: 403 });
        }
        
        await prisma.config.upsert({
            where: { id: 'adminPasscode' },
            update: { value: { value: newPasscode } },
            create: { id: 'adminPasscode', value: { value: newPasscode } },
        });

        return NextResponse.json({ message: 'Passcode updated successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Passcode Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input.', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
