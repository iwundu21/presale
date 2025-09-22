
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
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

        // The balance from prisma is a Decimal. It must be converted to a number for JSON serialization.
        // First filter out any potential null/undefined balances, then map.
        const usersWithNumberBalance = users
            .filter(user => user.balance) // Ensure balance is not null, undefined, or 0
            .map(user => ({
                wallet: user.wallet,
                // At this point, user.balance is guaranteed to be a Decimal object
                balance: user.balance!.toNumber(), 
            }));

        return NextResponse.json(usersWithNumberBalance, { status: 200 });

    } catch (error) {
        console.error('API All-Users-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
