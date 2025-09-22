
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Decimal } from '@prisma/client/runtime/library';

type UserWithBalance = {
    wallet: string;
    balance: Decimal | null;
};

export async function GET() {
    try {
        const users: UserWithBalance[] = await prisma.user.findMany({
            select: {
                wallet: true,
                balance: true,
            },
            where: {
                balance: {
                    gt: 0,
                }
            },
            orderBy: {
                wallet: 'asc'
            }
        });

        const usersWithNumberBalance = users.map(user => {
            return {
                wallet: user.wallet,
                balance: user.balance ? user.balance.toNumber() : 0,
            }
        });

        return NextResponse.json(usersWithNumberBalance, { status: 200 });

    } catch (error) {
        console.error('API All-Users-Data Error:', error);
        // Provide more error detail in the response for debugging
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}
