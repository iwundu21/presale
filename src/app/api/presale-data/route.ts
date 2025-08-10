
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function setConfig(key: string, value: any) {
     await prisma.config.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
    });
    return value;
}

async function getConfig(key: string, defaultValue: any) {
    const config = await prisma.config.findUnique({ where: { key }});
    if (!config) {
        // If the key doesn't exist, create it with the default value
        return await setConfig(key, defaultValue);
    }

    try {
        // The value from DB is always a string, so parse it.
        return JSON.parse(config.value);
    } catch {
        // If parsing fails, it might be an old value that wasn't a string.
        // In that case, we can probably assume it's the value itself,
        // but it's safer to return the default.
        return defaultValue;
    }
}


export async function GET() {
    try {
        const [totalExnSold, presaleInfo, isPresaleActive] = await Promise.all([
            prisma.user.aggregate({ _sum: { balance: true } }).then(res => res._sum.balance || 0),
            getConfig('presaleInfo', { seasonName: "Early Stage", tokenPrice: 0.09 }),
            getConfig('isPresaleActive', true)
        ]);

        return NextResponse.json({ 
            totalExnSold,
            presaleInfo,
            isPresaleActive,
        }, { status: 200 });
    } catch (error) {
        console.error('API Presale-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
     try {
        const { presaleInfo, isPresaleActive } = await request.json();
        
        if (presaleInfo) {
            if (!presaleInfo.seasonName || typeof presaleInfo.tokenPrice !== 'number') {
                 return NextResponse.json({ message: 'Invalid input for presale info' }, { status: 400 });
            }
            await setConfig('presaleInfo', presaleInfo);
        }

        if (typeof isPresaleActive === 'boolean') {
            await setConfig('isPresaleActive', isPresaleActive);
        }

        const updatedPresaleInfo = await getConfig('presaleInfo', { seasonName: "Early Stage", tokenPrice: 0.09 });
        const updatedIsPresaleActive = await getConfig('isPresaleActive', true);
        
        return NextResponse.json({ 
            message: 'Presale data updated successfully',
            presaleInfo: updatedPresaleInfo,
            isPresaleActive: updatedIsPresaleActive,
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Presale-Data POST Error:', error);
        if (error.message.includes('Invalid input')) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
