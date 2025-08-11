
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const defaultPresaleInfo = { seasonName: "Early Stage", tokenPrice: 0.09 };

export async function GET() {
    try {
        const totalExnSoldResult = await prisma.user.aggregate({
            _sum: { balance: true }
        });
        const totalExnSold = totalExnSoldResult._sum.balance || 0;
        
        const presaleInfoConfig = await prisma.config.findUnique({
            where: { key: 'presaleInfo' },
        });
        const presaleInfo = presaleInfoConfig ? (presaleInfoConfig.value as typeof defaultPresaleInfo) : defaultPresaleInfo;
        
        const isPresaleActiveConfig = await prisma.config.findUnique({
             where: { key: 'isPresaleActive' },
        });
        const isPresaleActive = isPresaleActiveConfig ? (isPresaleActiveConfig.value as boolean) : true;
        

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
            await prisma.config.upsert({
                where: { key: 'presaleInfo' },
                update: { value: presaleInfo as any },
                create: { key: 'presaleInfo', value: presaleInfo as any }
            });
        }

        if (typeof isPresaleActive === 'boolean') {
             await prisma.config.upsert({
                where: { key: 'isPresaleActive' },
                update: { value: isPresaleActive },
                create: { key: 'isPresaleActive', value: isPresaleActive }
            });
        }

        const updatedPresaleInfoConfig = await prisma.config.findUnique({ where: { key: 'presaleInfo' } });
        const updatedIsPresaleActiveConfig = await prisma.config.findUnique({ where: { key: 'isPresaleActive' } });
        
        return NextResponse.json({ 
            message: 'Presale data updated successfully',
            presaleInfo: updatedPresaleInfoConfig?.value || defaultPresaleInfo,
            isPresaleActive: updatedIsPresaleActiveConfig?.value === undefined ? true : updatedIsPresaleActiveConfig.value,
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Presale-Data POST Error:', error);
        if (error.message.includes('Invalid input')) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
