
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const updateBalanceSchema = z.object({
  wallet: z.string().min(32, "Invalid wallet address"),
  balance: z.number().min(0, "Balance cannot be negative"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { wallet, balance } = updateBalanceSchema.parse(body);

        const decimalBalance = new Prisma.Decimal(balance);

        const updatedUser = await prisma.$transaction(async (tx) => {
            // Get the current user state before updating
            const currentUser = await tx.user.findUnique({
                where: { wallet: wallet },
            });

            if (!currentUser) {
                // Although upsert would handle this, we need to throw a specific error
                // that our outer catch block can interpret as a 404.
                throw new Prisma.PrismaClientKnownRequestError('User not found', {
                    code: 'P2025',
                    clientVersion: '2.19.0'
                });
            }

            const oldBalance = currentUser.balance;

            // Update the user's balance
            const user = await tx.user.update({
                where: { wallet: wallet },
                data: { balance: decimalBalance },
            });

            // If the new balance is an increase, increment the auction slots sold
            if (decimalBalance.greaterThan(oldBalance)) {
                await tx.config.upsert({
                    where: { id: 'auctionSlotsSold' },
                    update: { 
                        value: { 
                            // Using Prisma's atomic increment operation
                            increment: 1 
                        }
                    },
                    create: { id: 'auctionSlotsSold', value: { value: 1 } },
                });
            } else if (decimalBalance.lessThan(oldBalance)) {
                // Optional: handle balance decrease (e.g., decrement slots if needed)
                // For now, we do nothing as per the requirement to only track additions.
            }
            
            return user;
        });

        const responseUser = {
            ...updatedUser,
            balance: updatedUser.balance.toNumber(),
        };

        return NextResponse.json(responseUser, { status: 200 });

    } catch (error) {
        console.error('API Update-User-Balance Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input', details: error.errors }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                 return NextResponse.json({ message: `User with wallet not found.` }, { status: 404 });
            }
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}
