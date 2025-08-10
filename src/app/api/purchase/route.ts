
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userKey, exnAmount, transaction } = await request.json();

        if (!userKey || !transaction || !transaction.id) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.upsert({
                where: { wallet: userKey },
                update: {},
                create: { wallet: userKey, balance: 0 }
            });

            // Use upsert to handle both creation of new pending tx and update of its status
            await tx.transaction.upsert({
                where: { id: transaction.id },
                update: {
                    status: transaction.status,
                    failureReason: transaction.failureReason,
                    blockhash: transaction.blockhash,
                    lastValidBlockHeight: transaction.lastValidBlockHeight,
                },
                create: {
                    id: transaction.id,
                    amountExn: transaction.amountExn,
                    paidAmount: transaction.paidAmount,
                    paidCurrency: transaction.paidCurrency,
                    date: new Date(transaction.date),
                    status: transaction.status,
                    failureReason: transaction.failureReason,
                    blockhash: transaction.blockhash,
                    lastValidBlockHeight: transaction.lastValidBlockHeight,
                    userWallet: user.wallet,
                }
            });
            
            let updatedBalance = user.balance;
            if (transaction.status === 'Completed') {
                 // Only increment balance on completion
                 const existingTx = await tx.transaction.findUnique({ where: { id: transaction.id }});

                 // Check if balance was already added for this tx to prevent double counting
                 if(existingTx && !existingTx.balanceAdded) {
                    const updatedUser = await tx.user.update({
                        where: { wallet: userKey },
                        data: {
                            balance: {
                                increment: exnAmount
                            }
                        }
                    });
                    await tx.transaction.update({
                        where: { id: transaction.id },
                        data: { balanceAdded: true }
                    });
                    updatedBalance = updatedUser.balance;
                 }
            }

            const totalExnSold = await tx.user.aggregate({
                _sum: {
                    balance: true
                }
            });

            const userTransactions = await tx.transaction.findMany({
                where: { userWallet: userKey },
                orderBy: { date: 'desc' }
            });

            return {
                message: 'Purchase recorded',
                newBalance: updatedBalance,
                newTotalSold: totalExnSold._sum.balance || 0,
                transactions: userTransactions,
            };
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('API Purchase Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

    