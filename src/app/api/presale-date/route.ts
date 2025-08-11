
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const getDefaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
};

export async function GET() {
    try {
        const presaleEndDateConfig = await prisma.config.findUnique({
            where: { key: 'presaleEndDate' }
        });
        const presaleEndDate = presaleEndDateConfig ? (presaleEndDateConfig.value as string) : getDefaultEndDate();
        
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
        
        await prisma.config.upsert({
            where: { key: 'presaleEndDate' },
            update: { value: presaleEndDate },
            create: { key: 'presaleEndDate', value: presaleEndDate }
        });
        
        return NextResponse.json({ 
            message: 'Presale end date updated successfully',
            presaleEndDate,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Date POST Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
