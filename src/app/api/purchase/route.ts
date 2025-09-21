

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Transaction } from '@/components/dashboard-client-provider';

export async function POST(request: Request) {
    try {
        const { userKey, exnAmount, transaction } = await request.json() as { userKey: string; exnAmount: number; transaction: Transaction };

        if (!userKey || !transaction || !transaction.id) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }
        
        // Since we now only record successful transactions, we can proceed directly.
        const result = await prisma.$transaction(async (tx) => {
             // Create or find user
            let user = await tx.user.findUnique({ where: { wallet: userKey } });
            if (!user) {
                user = await tx.user.create({ data: { wallet: userKey, balance: 0 } });
            }

            // Check if this transaction signature has already been processed
            const existingTx = await tx.transaction.findUnique({
                where: { id: transaction.id },
            });

            if (existingTx) {
                // If it exists, it means the user might have refreshed the page
                // after a successful purchase but before the UI updated.
                // We shouldn't process it again. Just return the current state.
                console.log(`Transaction ${transaction.id} already processed. Skipping.`);
            } else {
                 // Create the transaction record
                await tx.transaction.create({
                    data: {
                        id: transaction.id,
                        amountExn: transaction.amountExn,
                        paidAmount: transaction.paidAmount,
                        paidCurrency: transaction.paidCurrency,
                        date: transaction.date,
                        status: 'Completed', // Always completed now
                        blockhash: transaction.blockhash,
                        lastValidBlockHeight: transaction.lastValidBlockHeight,
                        balanceAdded: true, // Balance is added in this transaction
                        userWallet: userKey,
                    }
                });

                // Update user's balance
                await tx.user.update({
                    where: { wallet: userKey },
                    data: {
                        balance: {
                            increment: exnAmount,
                        },
                    },
                });
                
                // Atomically update the total sold amount
                await tx.config.upsert({
                    where: { id: 'totalExnSold' },
                    update: { 
                        value: { 
                            increment: exnAmount 
                        }
                    },
                    create: { 
                        id: 'totalExnSold', 
                        value: { value: exnAmount } 
                    },
                });
            }

            // Fetch updated data to return inside the transaction
            const updatedUser = await tx.user.findUnique({
                where: { wallet: userKey },
                include: {
                    transactions: { orderBy: { date: 'desc' } }
                }
            });
            const totalSoldConfig = await tx.config.findUnique({ where: { id: 'totalExnSold' } });
            const finalTotalSold = (totalSoldConfig?.value as { value: number })?.value || 0;

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

    