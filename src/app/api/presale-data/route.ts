

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const presaleInfoSchema = z.object({
  seasonName: z.string(),
  tokenPrice: z.number(),
  hardCap: z.number(),
});

const dateSchema = z.string().datetime();

const defaultPresaleInfo = { 
    seasonName: "Presale", 
    tokenPrice: 0.09, 
    hardCap: 0,
};

const getDefaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString();
};


export async function GET() {
    try {
        const configs = await prisma.config.findMany({
            where: {
                id: { in: ['presaleInfo', 'isPresaleActive', 'presaleEndDate'] }
            }
        });

        const configMap = new Map(configs.map(c => [c.id, c.value]));

        const presaleInfoRaw = configMap.get('presaleInfo');
        const presaleInfoParsed = presaleInfoSchema.safeParse(presaleInfoRaw);
        const presaleInfo = presaleInfoParsed.success ? presaleInfoParsed.data : defaultPresaleInfo;

        const isPresaleActive = (configMap.get('isPresaleActive') as boolean) ?? true;
        
        let presaleEndDate = configMap.get('presaleEndDate') as string | undefined;
        if (!presaleEndDate || isNaN(new Date(presaleEndDate).getTime())) {
            presaleEndDate = getDefaultEndDate();
        }

        const totalSoldAggregate = await prisma.user.aggregate({
            _sum: {
                balance: true,
            }
        });
        const totalExnSold = totalSoldAggregate._sum.balance || 0;

        return NextResponse.json({
            totalExnSoldForCurrentStage: totalExnSold,
            presaleInfo: presaleInfo,
            isPresaleActive: isPresaleActive,
            presaleEndDate: presaleEndDate,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Data GET Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}

export async function POST(request: Request) {
     try {
        const body = await request.json();

        // Use transactions for multiple updates
        const updateTasks: any[] = [];

        if (body.presaleInfo) {
            const parsedInfo = presaleInfoSchema.parse(body.presaleInfo);
            updateTasks.push(prisma.config.upsert({
                where: { id: 'presaleInfo' },
                update: { value: parsedInfo },
                create: { id: 'presaleInfo', value: parsedInfo },
            }));
        }

        if (typeof body.isPresaleActive === 'boolean') {
             updateTasks.push(prisma.config.upsert({
                where: { id: 'isPresaleActive' },
                update: { value: body.isPresaleActive },
                create: { id: 'isPresaleActive', value: body.isPresaleActive },
            }));
        }
        
        if (body.presaleEndDate) {
            const parsedDate = dateSchema.parse(body.presaleEndDate);
            updateTasks.push(prisma.config.upsert({
                where: { id: 'presaleEndDate' },
                update: { value: parsedDate },
                create: { id: 'presaleEndDate', value: parsedDate },
            }));
        }

        if (updateTasks.length > 0) {
            await prisma.$transaction(updateTasks);
        }

        // After updates, re-fetch all data to return the consistent state
        const configs = await prisma.config.findMany({
            where: {
                id: { in: ['presaleInfo', 'isPresaleActive', 'presaleEndDate'] }
            }
        });
        const configMap = new Map(configs.map(c => [c.id, c.value]));

        const presaleInfoRaw = configMap.get('presaleInfo');
        const presaleInfoParsed = presaleInfoSchema.safeParse(presaleInfoRaw);
        const updatedInfo = presaleInfoParsed.success ? presaleInfoParsed.data : defaultPresaleInfo;

        const updatedIsPresaleActive = (configMap.get('isPresaleActive') as boolean) ?? true;
        
        let updatedEndDate = configMap.get('presaleEndDate') as string | undefined;
        if (!updatedEndDate || isNaN(new Date(updatedEndDate).getTime())) {
            updatedEndDate = getDefaultEndDate();
        }
        
        const totalSoldAggregate = await prisma.user.aggregate({
            _sum: {
                balance: true,
            }
        });
        const totalExnSold = totalSoldAggregate._sum.balance || 0;

        return NextResponse.json({
            message: 'Presale data updated successfully',
            totalExnSoldForCurrentStage: totalExnSold,
            presaleInfo: updatedInfo,
            isPresaleActive: updatedIsPresaleActive,
            presaleEndDate: updatedEndDate,
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Presale-Data POST Error:', error);
        if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid input for presale info', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
