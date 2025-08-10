
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function setPresaleEndDate(endDate: string): Promise<void> {
    await prisma.config.upsert({
        where: { key: 'presaleEndDate' },
        update: { value: endDate },
        create: { key: 'presaleEndDate', value: endDate }
    });
}

async function getPresaleEndDate() {
    const config = await prisma.config.findUnique({
        where: { key: 'presaleEndDate' }
    });
    if (config && config.value) {
        return config.value;
    }
    // If no date is set in the DB, create a default.
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);
    const defaultEndDateString = defaultEndDate.toISOString();
    
    // Save the default to the DB for next time
    await setPresaleEndDate(defaultEndDateString);
    
    return defaultEndDateString;
}

export async function GET() {
    try {
        const presaleEndDate = await getPresaleEndDate();
        return NextResponse.json({ presaleEndDate });
    } catch (error) {
        console.error('API Presale-Date GET Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
     try {
        const { presaleEndDate } = await request.json();

        if (!presaleEndDate || isNaN(new Date(presaleEndDate).getTime())) {
            return NextResponse.json({ message: 'Invalid date format provided.' }, { status: 400 });
        }
        
        await setPresaleEndDate(presaleEndDate);
        
        return NextResponse.json({ 
            message: 'Presale end date updated successfully',
            presaleEndDate,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Date POST Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
