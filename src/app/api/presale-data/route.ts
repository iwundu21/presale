
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const defaultPresaleInfo = { seasonName: "Early Stage", tokenPrice: 0.09 };

const presaleInfoSchema = z.object({
  seasonName: z.string(),
  tokenPrice: z.number(),
});

async function getOrCreateConfig(id: string, defaultValue: any) {
  let config = await prisma.config.findUnique({ where: { id } });
  if (!config) {
    config = await prisma.config.create({
      data: { id, value: defaultValue },
    });
  }
  return config.value;
}

export async function GET() {
    try {
        const totalSoldAggregate = await prisma.user.aggregate({
            _sum: {
                balance: true,
            },
        });
        const totalExnSold = totalSoldAggregate._sum.balance || 0;

        const presaleInfoValue = await getOrCreateConfig('presaleInfo', defaultPresaleInfo);
        const isPresaleActiveValue = await getOrCreateConfig('isPresaleActive', { value: true });

        const presaleInfo = presaleInfoSchema.safeParse(presaleInfoValue);

        return NextResponse.json({
            totalExnSold,
            presaleInfo: presaleInfo.success ? presaleInfo.data : defaultPresaleInfo,
            isPresaleActive: (isPresaleActiveValue as { value: boolean })?.value ?? true,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Data Error:', error);
        return NextResponse.json({
            totalExnSold: 0,
            presaleInfo: defaultPresaleInfo,
            isPresaleActive: true,
        }, { status: 500 });
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
                update: { value: { value: isPresaleActive } },
                create: { id: 'isPresaleActive', value: { value: isPresaleActive } },
            });
        }

        const updatedPresaleInfoValue = await getOrCreateConfig('presaleInfo', defaultPresaleInfo);
        const updatedIsPresaleActiveValue = await getOrCreateConfig('isPresaleActive', { value: true });
        const updatedInfo = presaleInfoSchema.safeParse(updatedPresaleInfoValue);

        return NextResponse.json({
            message: 'Presale data updated successfully',
            presaleInfo: updatedInfo.success ? updatedInfo.data : defaultPresaleInfo,
            isPresaleActive: (updatedIsPresaleActiveValue as { value: boolean })?.value ?? true,
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Presale-Data POST Error:', error);
        if (error instanceof z.ZodError) {
             return NextResponse.json({ message: 'Invalid input for presale info', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
