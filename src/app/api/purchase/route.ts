
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Transaction } from '@/components/dashboard-client-provider';

export async function POST(request: Request) {
    try {
        const { userKey, exnAmount, transaction } = await request.json() as { userKey: string; exnAmount: number; transaction: Transaction };

        if (!userKey || !transaction || !transaction.id) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }
        
        // Use an explicit transaction ID if it's not a temporary one
        const txId = transaction.id.startsWith('temp_') ? undefined : transaction.id;

        const upsertData = {
            id: txId, // Let cuid generate if undefined
            amountExn: transaction.amountExn,
            paidAmount: transaction.paidAmount,
            paidCurrency: transaction.paidCurrency,
            date: transaction.date,
            status: transaction.status,
            failureReason: transaction.failureReason,
            blockhash: transaction.blockhash,
            lastValidBlockHeight: transaction.lastValidBlockHeight,
            balanceAdded: transaction.status === 'Completed'
        };

        const user = await prisma.user.upsert({
            where: { wallet: userKey },
            update: {},
            create: { wallet: userKey },
            include: { transactions: true }
        });
        
        const existingTx = await prisma.transaction.findFirst({
            where: { id: transaction.id },
        });

        if (existingTx) {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: upsertData
            });
        } else {
             await prisma.transaction.create({
                data: {
                    ...upsertData,
                    userWallet: userKey
                }
            });
        }
        
        const currentUser = await prisma.user.findUnique({
            where: { wallet: userKey },
            include: { transactions: true }
        });
        
        let newBalance = currentUser?.balance || 0;

        if (transaction.status === 'Completed') {
            const completedTx = await prisma.transaction.findUnique({ where: { id: transaction.id } });
            if (completedTx && !completedTx.balanceAdded) {
                newBalance += exnAmount;
                await prisma.user.update({
                    where: { wallet: userKey },
                    data: { balance: newBalance }
                });
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { balanceAdded: true }
                });
            }
        }
        
        const totalExnSoldResult = await prisma.user.aggregate({ _sum: { balance: true } });
        const newTotalSold = totalExnSoldResult._sum.balance || 0;

        const updatedUser = await prisma.user.findUnique({
            where: { wallet: userKey },
            include: { transactions: { orderBy: { date: 'desc' }}}
        });

        return NextResponse.json({
            message: 'Purchase recorded',
            newBalance: newBalance,
            newTotalSold: newTotalSold,
            transactions: updatedUser?.transactions || [],
        }, { status: 200 });

    } catch (error) {
        console.error('API Purchase Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
