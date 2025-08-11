
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userKey = searchParams.get('userKey');

    if (!userKey) {
        return NextResponse.json({ message: 'User key is required' }, { status: 400 });
    }

    try {
        let user = await prisma.user.findUnique({
            where: { wallet: userKey },
            include: {
                transactions: {
                    orderBy: {
                        date: 'desc',
                    },
                },
            },
        });

        if (!user) {
            // If user does not exist, create a new document for them
            user = await prisma.user.create({
                data: {
                    wallet: userKey,
                    balance: 0,
                },
                include: {
                    transactions: true,
                },
            });
        }

        return NextResponse.json({
            balance: user.balance,
            transactions: user.transactions,
        }, { status: 200 });

    } catch (error) {
        console.error('API User-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
