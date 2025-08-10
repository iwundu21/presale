
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Transaction } from '@/components/dashboard-client-provider';

type UserAdminView = {
    wallet: string;
    balance: number;
    transactions: Transaction[];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '0', 10);
        const searchQuery = searchParams.get('searchQuery')?.toLowerCase() || '';

        const where = searchQuery 
            ? { wallet: { contains: searchQuery, mode: 'insensitive' as const } } 
            : {};

        const totalUsers = await prisma.user.count({ where });

        const usersQuery = {
            where,
            include: {
                transactions: {
                    orderBy: {
                        date: 'desc' as const,
                    }
                }
            },
            orderBy: {
                balance: 'desc' as const,
            },
        };

        if (limit > 0) {
            (usersQuery as any).skip = (page - 1) * limit;
            (usersQuery as any).take = limit;
        }

        const users = await prisma.user.findMany(usersQuery);

        const userArray: UserAdminView[] = users.map(user => ({
            wallet: user.wallet,
            balance: user.balance,
            transactions: user.transactions.map(tx => ({
                id: tx.id,
                amountExn: tx.amountExn,
                paidAmount: tx.paidAmount,
                paidCurrency: tx.paidCurrency,
                date: tx.date,
                status: tx.status as Transaction['status'],
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
