
import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';


export async function GET() {
    try {
        const presaleEndDate = await db.getPresaleEndDate();
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
        
        await db.setPresaleEndDate(presaleEndDate);
        
        return NextResponse.json({ 
            message: 'Presale end date updated successfully',
            presaleEndDate,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Date POST Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
