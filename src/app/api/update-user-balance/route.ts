

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

        const updatedUser = await prisma.user.update({
            where: { wallet: wallet },
            data: { balance: decimalBalance },
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
            // "An operation failed because it depends on one or more records that were required but not found."
            if (error.code === 'P2025') {
                 return NextResponse.json({ message: `User with wallet not found.` }, { status: 404 });
            }
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}
