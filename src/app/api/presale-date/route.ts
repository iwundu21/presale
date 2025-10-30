
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const getDefaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
};

export async function GET() {
    try {
        const config = await prisma.config.findUnique({ where: { id: 'presaleEndDate' } });
        let presaleEndDate;
        if (config) {
            // The value is stored directly, not nested.
            presaleEndDate = config.value as string;
        } else {
            presaleEndDate = getDefaultEndDate();
        }
        return NextResponse.json({ presaleEndDate }, { status: 200 });
    } catch (error) {
        console.error('API Presale-Date GET Error:', error);
        // Fallback to default on any error
        return NextResponse.json({ presaleEndDate: getDefaultEndDate() }, { status: 200 });
    }
}

export async function POST(request: Request) {
     try {
        const { presaleEndDate } = await request.json();

        const dateSchema = z.string().datetime();
        const parsedDate = dateSchema.parse(presaleEndDate);

        await prisma.config.upsert({
            where: { id: 'presaleEndDate' },
            update: { value: parsedDate },
            create: { id: 'presaleEndDate', value: parsedDate },
        });
        
        return NextResponse.json({
            message: 'Presale end date updated successfully',
            presaleEndDate: parsedDate,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Date POST Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid date format provided.', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
