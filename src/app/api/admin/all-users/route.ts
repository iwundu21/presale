
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Transaction } from '@prisma/client';

type UserAdminView = {
    wallet: string;
    balance: number;
    transactions: Transaction[];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const searchQuery = searchParams.get('searchQuery')?.toLowerCase() || '';

        const whereCondition = searchQuery ? { wallet: { contains: searchQuery } } : {};
        
        const totalUsers = await prisma.user.count({ where: whereCondition });

        const users = await prisma.user.findMany({
            where: whereCondition,
            take: limit > 0 ? limit : undefined,
            skip: limit > 0 ? (page - 1) * limit : undefined,
            orderBy: { balance: 'desc' },
            include: {
                transactions: {
                    orderBy: { date: 'desc' },
                },
            },
        });

        const userArray: UserAdminView[] = users.map(user => ({
            wallet: user.wallet,
            balance: user.balance,
            transactions: user.transactions.map(tx => ({
                ...tx,
                failureReason: tx.failureReason || undefined,
                blockhash: tx.blockhash || undefined,
                lastValidBlockHeight: tx.lastValidBlockHeight || undefined,
            })),
        }));

        return NextResponse.json({
            users: userArray,
            total: totalUsers,
            page,
            totalPages: limit > 0 ? Math.ceil(totalUsers / limit) : 1
        }, { status: 200 });

    } catch (error) {
        console.error('API All-Users Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
