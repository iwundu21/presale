
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const bonusConfig = await prisma.config.findUnique({
            where: { key: 'bonusDistributed' }
        });

        if (bonusConfig && bonusConfig.value === true) {
            return NextResponse.json({ message: 'Bonus has already been distributed.' }, { status: 400 });
        }
        
        const usersToUpdate = await prisma.user.findMany({
            where: {
                balance: { gt: 0 }
            }
        });

        if (usersToUpdate.length === 0) {
             return NextResponse.json({ 
                message: `No users with a balance to distribute bonus to.`,
                updatedCount: 0 
            }, { status: 200 });
        }
        
        let updatedCount = 0;
        
        for (const user of usersToUpdate) {
            const bonusAmount = user.balance * 0.03;
            const newBalance = user.balance + bonusAmount;
            
            await prisma.user.update({
                where: { wallet: user.wallet },
                data: {
                    balance: newBalance,
                    transactions: {
                        create: {
                            id: `bonus-${uuidv4()}`,
                            amountExn: bonusAmount,
                            paidAmount: 0,
                            paidCurrency: 'BONUS',
                            date: new Date(),
                            status: 'Completed',
                            failureReason: 'Presale Bonus',
                            balanceAdded: true
                        }
                    }
                }
            });
            updatedCount++;
        }

        await prisma.config.upsert({
            where: { key: 'bonusDistributed' },
            update: { value: true },
            create: { key: 'bonusDistributed', value: true }
        });

        return NextResponse.json({ 
            message: `Successfully distributed 3% bonus to ${updatedCount} users.`,
            updatedCount: updatedCount 
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Distribute-Bonus Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const bonusConfig = await prisma.config.findUnique({
            where: { key: 'bonusDistributed' }
        });
        
        return NextResponse.json({ isBonusDistributed: bonusConfig?.value === true }, { status: 200 });
    } catch (error) {
        console.error('API Distribute-Bonus GET Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
