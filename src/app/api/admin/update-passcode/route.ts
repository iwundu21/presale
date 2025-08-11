
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { currentPasscode, newPasscode } = await request.json();
        
        if (!currentPasscode || !newPasscode) {
            return NextResponse.json({ message: 'Current and new passcodes are required.' }, { status: 400 });
        }

        const passcodeConfig = await prisma.config.findUnique({
            where: { key: 'adminPasscode' }
        });

        const correctPasscode = passcodeConfig ? String(passcodeConfig.value) : process.env.ADMIN_PASSCODE || '203020';

        if (currentPasscode !== correctPasscode) {
             return NextResponse.json({ message: 'Incorrect current passcode.' }, { status: 403 });
        }
        
        await prisma.config.upsert({
            where: { key: 'adminPasscode' },
            update: { value: newPasscode },
            create: { key: 'adminPasscode', value: newPasscode }
        });

        return NextResponse.json({ message: 'Passcode updated successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Passcode Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
