
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateBalanceSchema = z.object({
  wallet: z.string().min(1),
  newBalance: z.number().min(0),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, newBalance } = updateBalanceSchema.parse(body);

        await prisma.$transaction(async (tx) => {
            // Find the user to get their current balance
            const user = await tx.user.findUnique({
                where: { wallet: wallet },
            });

            if (!user) {
                throw new Error(`User with wallet ${wallet} not found.`);
            }

            const oldBalance = user.balance;
            const balanceDifference = newBalance - oldBalance;

            // Update the user's balance
            await tx.user.update({
                where: { wallet: wallet },
                data: { balance: newBalance },
            });
            
            // Update the total sold amount
            await tx.config.upsert({
                where: { id: 'totalExnSold' },
                update: {
                    value: {
                        // Using 'path' and 'increment' for atomic JSON field updates
                        path: ['value'],
                        increment: balanceDifference,
                    },
                },
                create: {
                    id: 'totalExnSold',
                    value: { value: balanceDifference },
                },
            });
        });

        return NextResponse.json({ message: `Balance for wallet ${wallet} updated to ${newBalance} and total sold adjusted.` }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Balance Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input.', details: error.errors }, { status: 400 });
        }
        // Use error.message to provide more specific feedback from the transaction
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
