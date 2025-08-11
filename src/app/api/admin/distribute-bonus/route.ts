
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const bonusConfig = await prisma.config.findUnique({ where: { id: 'bonusDistributed' } });

        if (bonusConfig && (bonusConfig.value as { value: boolean })?.value === true) {
            return NextResponse.json({ message: 'Bonus has already been distributed.' }, { status: 400 });
        }
        
        const usersToUpdate = await prisma.user.findMany({ where: { balance: { gt: 0 } } });

        if (usersToUpdate.length === 0) {
             return NextResponse.json({ 
                message: `No users with a balance to distribute bonus to.`,
                updatedCount: 0 
            }, { status: 200 });
        }
        
        const updates = usersToUpdate.map(user => {
            const bonusAmount = user.balance * 0.03;
            const newBalance = user.balance + bonusAmount;

            const updateUser = prisma.user.update({
                where: { wallet: user.wallet },
                data: { balance: newBalance },
            });

            const createTx = prisma.transaction.create({
                data: {
                    id: `bonus-${uuidv4()}`,
                    amountExn: bonusAmount,
                    paidAmount: 0,
                    paidCurrency: 'BONUS',
                    date: new Date(),
                    status: 'Completed',
                    failureReason: 'Presale Bonus',
                    balanceAdded: true,
                    userWallet: user.wallet,
                },
            });
            return [updateUser, createTx];
        }).flat();

        await prisma.$transaction(updates);

        await prisma.config.upsert({
            where: { id: 'bonusDistributed' },
            update: { value: { value: true } },
            create: { id: 'bonusDistributed', value: { value: true } },
        });

        return NextResponse.json({ 
            message: `Successfully distributed 3% bonus to ${usersToUpdate.length} users.`,
            updatedCount: usersToUpdate.length
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Distribute-Bonus Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const bonusConfig = await prisma.config.findUnique({ where: { id: 'bonusDistributed' } });
        const isBonusDistributed = bonusConfig ? (bonusConfig.value as { value: boolean })?.value === true : false;
        
        return NextResponse.json({ isBonusDistributed }, { status: 200 });
    } catch (error) {
        console.error('API Distribute-Bonus GET Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
