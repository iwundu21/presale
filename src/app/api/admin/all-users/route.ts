
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Transaction } from '@/components/dashboard-client-provider';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

type UserAdminView = {
    wallet: string;
    balance: number;
    transactions: Transaction[];
}

async function readDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return { users: {} };
        }
        throw error;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '0', 10);
        const searchQuery = searchParams.get('searchQuery')?.toLowerCase() || '';

        const db = await readDb();
        const allUsers = db.users || {};

        let userArray: UserAdminView[] = Object.entries(allUsers).map(([wallet, data]: [string, any]) => ({
            wallet,
            balance: data.balance || 0,
            transactions: (data.transactions || []).map((tx: any) => ({...tx, date: new Date(tx.date)}))
        }));

        // Filter users based on search query
        if (searchQuery) {
            userArray = userArray.filter(user => user.wallet.toLowerCase().includes(searchQuery));
        }

        // Sort by balance descending
        userArray.sort((a, b) => b.balance - a.balance);

        const totalUsers = userArray.length;

        // If limit is not provided (or is 0), return all (filtered) users
        if (!limit) {
            return NextResponse.json({
                users: userArray,
                total: totalUsers,
            }, { status: 200 });
        }

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedUsers = userArray.slice(startIndex, endIndex);

        return NextResponse.json({
            users: paginatedUsers,
            total: totalUsers,
            page,
            totalPages: Math.ceil(totalUsers / limit)
        }, { status: 200 });

    } catch (error) {
        console.error('API All-Users Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
