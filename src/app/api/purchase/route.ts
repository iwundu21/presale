
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Transaction } from '@/components/dashboard-client-provider';

export async function POST(request: Request) {
    try {
        const { userKey, exnAmount, transaction, tempTxId } = await request.json() as { userKey: string; exnAmount: number; transaction: Transaction, tempTxId?: string };

        if (!userKey || !transaction || !transaction.id) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }
        
        let finalTotalSold = 0;

        const result = await prisma.$transaction(async (tx) => {
             // Create or find user
            let user = await tx.user.findUnique({ where: { wallet: userKey } });
            if (!user) {
                user = await tx.user.create({ data: { wallet: userKey, balance: 0 } });
            }

            // Prepare transaction data
            const txData = {
                id: transaction.id,
                amountExn: transaction.amountExn,
                paidAmount: transaction.paidAmount,
                paidCurrency: transaction.paidCurrency,
                date: transaction.date,
                status: transaction.status,
                failureReason: transaction.failureReason,
                blockhash: transaction.blockhash,
                lastValidBlockHeight: transaction.lastValidBlockHeight,
                balanceAdded: transaction.balanceAdded,
                userWallet: userKey,
            };

            // If a tempId was provided, it means we are updating a pending record
            // with its final signature and state.
            if (tempTxId && tempTxId.startsWith('temp_')) {
                const existingTx = await tx.transaction.findUnique({ where: { id: tempTxId } });
                if (existingTx) {
                     // Delete the old temp record and create the new permanent one.
                     // This avoids unique constraint issues if the user retries and gets the same signature.
                    await tx.transaction.delete({ where: { id: tempTxId } });
                }
            }

            // Create or update the transaction record with its final ID (the signature)
            await tx.transaction.upsert({
                where: { id: transaction.id },
                update: txData,
                create: txData,
            });

            // Update balance if completed and not already added
            if (transaction.status === 'Completed' && transaction.balanceAdded === false) {
                await tx.user.update({
                    where: { wallet: userKey },
                    data: {
                        balance: {
                            increment: exnAmount,
                        },
                    },
                });
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: { balanceAdded: true },
                });
                
                // Atomically update the total sold amount
                const totalSoldConfig = await tx.config.findUnique({ where: { id: 'totalExnSold' } });
                const currentTotalSold = (totalSoldConfig?.value as { value: number })?.value || 0;
                finalTotalSold = currentTotalSold + exnAmount;

                await tx.config.upsert({
                    where: { id: 'totalExnSold' },
                    update: { value: { value: finalTotalSold } },
                    create: { id: 'totalExnSold', value: { value: exnAmount } },
                });
            } else {
                 const totalSoldConfig = await tx.config.findUnique({ where: { id: 'totalExnSold' } });
                 finalTotalSold = (totalSoldConfig?.value as { value: number })?.value || 0;
            }

            // Fetch updated data to return inside the transaction
            const updatedUser = await tx.user.findUnique({
                where: { wallet: userKey },
                include: {
                    transactions: { orderBy: { date: 'desc' } }
                }
            });

            return { updatedUser, newTotalSold: finalTotalSold };
        });

        return NextResponse.json({
            message: 'Purchase recorded',
            newBalance: result.updatedUser?.balance || 0,
            newTotalSold: result.newTotalSold,
            transactions: result.updatedUser?.transactions || [],
        }, { status: 200 });

    } catch (error) {
        console.error('API Purchase Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
