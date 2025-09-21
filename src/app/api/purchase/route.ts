

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Transaction } from '@/components/dashboard-client-provider';

export async function POST(request: Request) {
    try {
        const { userKey, transaction } = await request.json() as { userKey: string; transaction: Transaction };

        if (!userKey || !transaction || !transaction.id) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }
        
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create or find user
            let user = await tx.user.findUnique({ where: { wallet: userKey } });
            if (!user) {
                user = await tx.user.create({ data: { wallet: userKey, balance: 0 } });
            }

            // 2. Check if this transaction has already been processed
            const existingTx = await tx.transaction.findUnique({ where: { id: transaction.id } });

            if (existingTx) {
                console.log(`Transaction ${transaction.id} already processed. Skipping.`);
            } else {
                 // 3. Create the new transaction record (Completed or Failed)
                await tx.transaction.create({
                    data: {
                        id: transaction.id,
                        amountExn: transaction.amountExn,
                        paidAmount: transaction.paidAmount,
                        paidCurrency: transaction.paidCurrency,
                        date: transaction.date,
                        status: transaction.status,
                        failureReason: transaction.failureReason,
                        blockhash: transaction.blockhash,
                        lastValidBlockHeight: transaction.lastValidBlockHeight,
                        userWallet: userKey,
                    }
                });

                // 4. If completed, update user balance
                if (transaction.status === 'Completed') {
                    await tx.user.update({
                        where: { wallet: userKey },
                        data: {
                            balance: {
                                increment: transaction.amountExn,
                            },
                        },
                    });
                }
            }

            // 5. Fetch updated data to return
            const updatedUser = await tx.user.findUnique({
                where: { wallet: userKey },
                include: {
                    transactions: { orderBy: { date: 'desc' } }
                }
            });
            
            const totalSoldAggregate = await tx.user.aggregate({
                _sum: {
                    balance: true,
                },
            });
            const finalTotalSold = totalSoldAggregate._sum.balance || 0;

            return { updatedUser, newTotalSold: finalTotalSold };
        });

        return NextResponse.json({
            message: `Transaction ${transaction.status}`,
            newBalance: result.updatedUser?.balance || 0,
            newTotalSold: result.newTotalSold,
            transactions: result.updatedUser?.transactions || [],
        }, { status: 200 });

    } catch (error) {
        console.error('API Purchase Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
