
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

        // Allow either the hardcoded default or the DB value as the "current" passcode
        const defaultPasscode = process.env.ADMIN_PASSCODE || '203040';
        let dbPasscode = defaultPasscode;
        
        try {
            const configDoc = await prisma.config.findUnique({ where: { id: 'adminPasscode' } });
            if (configDoc) {
                dbPasscode = (configDoc.value as { value: string }).value;
            }
        } catch(dbError){
            console.error("Could not fetch DB passcode for update:", dbError);
        }

        if (currentPasscode !== defaultPasscode && currentPasscode !== dbPasscode) {
             return NextResponse.json({ message: 'Incorrect current passcode.' }, { status: 403 });
        }
        
        await prisma.config.upsert({
            where: { id: 'adminPasscode' },
            update: { value: { value: newPasscode } },
            create: { id: 'adminPasscode', value: { value: newPasscode } },
        });

        return NextResponse.json({ message: 'Passcode updated successfully.' }, { status: 200 });

    } catch (error: any)
 {
        console.error('API Update-Passcode Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input.', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
