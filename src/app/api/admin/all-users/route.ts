
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Transaction } from '@/components/dashboard-client-provider';

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

        const whereCondition = searchQuery ? {
            wallet: {
                contains: searchQuery,
                mode: 'insensitive' as const
            }
        } : {};

        const usersData = await prisma.user.findMany({
            where: whereCondition,
            include: {
                transactions: {
                    orderBy: {
                        date: 'desc'
                    }
                }
            },
            orderBy: {
                balance: 'desc'
            },
            take: limit > 0 ? limit : undefined,
            skip: limit > 0 ? (page - 1) * limit : undefined,
        });

        const totalUsers = await prisma.user.count({ where: whereCondition });

        return NextResponse.json({
            users: usersData,
            total: totalUsers,
            page,
            totalPages: limit > 0 ? Math.ceil(totalUsers / limit) : 1
        }, { status: 200 });

    } catch (error) {
        console.error('API All-Users Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
