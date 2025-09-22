
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
                    not: null // Explicitly exclude null values
                }
            },
            orderBy: {
                wallet: 'asc'
            }
        });

        // The balance from prisma is a Decimal, convert it to a number for JSON serialization
        const usersWithNumberBalance = users.map(user => ({
            ...user,
            // We can now safely assume user.balance is not null due to the query
            balance: user.balance!.toNumber(), 
        }));

        return NextResponse.json(usersWithNumberBalance, { status: 200 });

    } catch (error) {
        console.error('API All-Users-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
