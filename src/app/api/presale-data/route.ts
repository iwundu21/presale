
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const defaultPresaleInfo = { 
    seasonName: "Presale", 
    tokenPrice: 0.09, 
    hardCap: 700000000,
    auctionUsdAmount: 50,
    auctionExnAmount: 50000,
    auctionSlots: 850,
};

const presaleInfoSchema = z.object({
  seasonName: z.string(),
  tokenPrice: z.number(),
  hardCap: z.number(),
  auctionUsdAmount: z.number(),
  auctionExnAmount: z.number(),
  auctionSlots: z.number(),
});

export async function GET() {
    try {
        const presaleInfoConfig = await prisma.config.findUnique({ where: { id: 'presaleInfo' } });
        const isPresaleActiveConfig = await prisma.config.findUnique({ where: { id: 'isPresaleActive' } });
        const auctionSlotsSoldConfig = await prisma.config.findUnique({ where: { id: 'auctionSlotsSold' } });

        const presaleInfo = presaleInfoSchema.safeParse(presaleInfoConfig?.value);
        
        const totalSoldAggregate = await prisma.user.aggregate({
            _sum: {
                balance: true,
            }
        });
        const totalExnSold = totalSoldAggregate._sum.balance?.toNumber() || 0;

        return NextResponse.json({
            totalExnSoldForCurrentStage: totalExnSold,
            presaleInfo: presaleInfo.success ? presaleInfo.data : defaultPresaleInfo,
            isPresaleActive: (isPresaleActiveConfig?.value as boolean) ?? true,
            auctionSlotsSold: (auctionSlotsSoldConfig?.value as number) ?? 0,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Data Error:', error);
        // If there's an error (e.g. database down), return default values with a 200 status
        // so the frontend can still render with fallback data.
        return NextResponse.json({
            totalExnSoldForCurrentStage: 0,
            presaleInfo: defaultPresaleInfo,
            isPresaleActive: true,
            auctionSlotsSold: 0,
        }, { status: 200 });
    }
}

export async function POST(request: Request) {
     try {
        const { presaleInfo, isPresaleActive } = await request.json();

        if (presaleInfo) {
            const parsedInfo = presaleInfoSchema.parse(presaleInfo);
            await prisma.config.upsert({
                where: { id: 'presaleInfo' },
                update: { value: parsedInfo },
                create: { id: 'presaleInfo', value: parsedInfo },
            });
        }

        if (typeof isPresaleActive === 'boolean') {
             await prisma.config.upsert({
                where: { id: 'isPresaleActive' },
                update: { value: isPresaleActive },
                create: { id: 'isPresaleActive', value: isPresaleActive },
            });
        }

        const presaleInfoConfig = await prisma.config.findUnique({ where: { id: 'presaleInfo' } });
        const isPresaleActiveConfig = await prisma.config.findUnique({ where: { id: 'isPresaleActive' } });
        const auctionSlotsSoldConfig = await prisma.config.findUnique({ where: { id: 'auctionSlotsSold' } });
        const updatedInfo = presaleInfoSchema.safeParse(presaleInfoConfig?.value);
        
        const totalSoldAggregate = await prisma.user.aggregate({
            _sum: {
                balance: true,
            }
        });
        const totalExnSold = totalSoldAggregate._sum.balance?.toNumber() || 0;

        return NextResponse.json({
            message: 'Presale data updated successfully',
            totalExnSoldForCurrentStage: totalExnSold,
            presaleInfo: updatedInfo.success ? updatedInfo.data : defaultPresaleInfo,
            isPresaleActive: (isPresaleActiveConfig?.value as boolean) ?? true,
            auctionSlotsSold: (auctionSlotsSoldConfig?.value as number) ?? 0,
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Presale-Data POST Error:', error);
        if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid input for presale info', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
