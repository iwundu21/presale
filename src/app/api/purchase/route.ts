
import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import type { Transaction } from '@/components/dashboard-client-provider';

export async function POST(request: Request) {
    try {
        const { userKey, exnAmount, transaction } = await request.json() as { userKey: string; exnAmount: number; transaction: Transaction };

        if (!userKey || !transaction || !transaction.id) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }

        const result = await db.updateUserOnPurchase(userKey, exnAmount, transaction);

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('API Purchase Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
