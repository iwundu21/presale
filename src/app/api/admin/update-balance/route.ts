
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
            // 1. Find the user to get their current balance
            const user = await tx.user.findUnique({
                where: { wallet: wallet },
            });

            if (!user) {
                throw new Error(`User with wallet ${wallet} not found.`);
            }

            const oldBalance = user.balance;
            const balanceDifference = newBalance - oldBalance;

            // 2. Fetch the current total sold amount
            const totalSoldConfig = await tx.config.findUnique({
                where: { id: 'totalExnSold' },
            });
            const currentTotalSold = (totalSoldConfig?.value as { value: number })?.value ?? 0;

            // 3. Calculate the new total
            const newTotalSold = currentTotalSold + balanceDifference;

            // 4. Update the user's balance
            await tx.user.update({
                where: { wallet: wallet },
                data: { balance: newBalance },
            });
            
            // 5. Update the total sold amount with the new calculated value
            await tx.config.upsert({
                where: { id: 'totalExnSold' },
                update: {
                    value: { value: newTotalSold },
                },
                create: {
                    id: 'totalExnSold',
                    value: { value: newTotalSold },
                },
            });
        });

        return NextResponse.json({ message: `Balance for wallet ${wallet} updated to ${newBalance} and total sold adjusted.` }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Balance Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input.', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
