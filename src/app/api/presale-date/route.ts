
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getPresaleEndDate() {
    const config = await prisma.config.findUnique({
        where: { key: 'presaleEndDate' }
    });
    if (config && config.value) {
        // The value is already a date string, return it directly.
        return config.value;
    }
    // If no date is set in the DB, create a default.
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);
    return defaultEndDate.toISOString();
}

async function setPresaleEndDate(endDate: string) {
    await prisma.config.upsert({
        where: { key: 'presaleEndDate' },
        update: { value: endDate },
        create: { key: 'presaleEndDate', value: endDate }
    });
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

