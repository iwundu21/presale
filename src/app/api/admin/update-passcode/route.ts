
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


async function getAdminPasscode(): Promise<string | null> {
    const config = await prisma.config.findUnique({
        where: { key: 'adminPasscode' }
    });
    return config ? config.value : process.env.ADMIN_PASSCODE || null;
}

async function setAdminPasscode(passcode: string): Promise<void> {
    await prisma.config.upsert({
        where: { key: 'adminPasscode' },
        update: { value: passcode },
        create: { key: 'adminPasscode', value: passcode }
    });
}


export async function POST(request: NextRequest) {
    try {
        const { currentPasscode, newPasscode } = await request.json();
        
        if (!currentPasscode || !newPasscode) {
            return NextResponse.json({ message: 'Current and new passcodes are required.' }, { status: 400 });
        }

        const correctPasscode = await getAdminPasscode();

        if (!correctPasscode) {
             return NextResponse.json({ message: 'Admin passcode is not configured.' }, { status: 500 });
        }

        if (currentPasscode !== correctPasscode) {
             return NextResponse.json({ message: 'Incorrect current passcode.' }, { status: 403 });
        }
        
        await setAdminPasscode(newPasscode);

        return NextResponse.json({ message: 'Passcode updated successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Passcode Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
