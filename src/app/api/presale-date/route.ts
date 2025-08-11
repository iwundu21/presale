
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const getDefaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
};

async function getOrCreateEndDate() {
    let config = await prisma.config.findUnique({ where: { id: 'presaleEndDate' } });
    if (!config) {
        const defaultEndDate = getDefaultEndDate();
        config = await prisma.config.create({
            data: { id: 'presaleEndDate', value: { value: defaultEndDate } },
        });
    }
    return (config.value as { value: string }).value;
}

export async function GET() {
    try {
        const presaleEndDate = await getOrCreateEndDate();
        return NextResponse.json({ presaleEndDate }, { status: 200 });
    } catch (error) {
        console.error('API Presale-Date GET Error:', error);
        const presaleEndDate = getDefaultEndDate();
        return NextResponse.json({ presaleEndDate }, { status: 200 });
    }
}

export async function POST(request: Request) {
     try {
        const { presaleEndDate } = await request.json();

        const dateSchema = z.string().datetime();
        const parsedDate = dateSchema.parse(presaleEndDate);

        await prisma.config.upsert({
            where: { id: 'presaleEndDate' },
            update: { value: { value: parsedDate } },
            create: { id: 'presaleEndDate', value: { value: parsedDate } },
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
