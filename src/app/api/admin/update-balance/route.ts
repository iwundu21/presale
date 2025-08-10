
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function POST(request: NextRequest) {
    try {
        const { wallet, newBalance } = await request.json();
        
        if (!wallet || typeof newBalance !== 'number' || newBalance < 0) {
            return NextResponse.json({ message: 'Wallet address and a valid new balance are required.' }, { status: 400 });
        }

        const success = await db.updateUserBalance(wallet, newBalance);

        if (!success) {
             return NextResponse.json({ message: `User with wallet ${wallet} not found.` }, { status: 404 });
        }

        return NextResponse.json({ message: `Balance for wallet ${wallet} updated to ${newBalance}.` }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Balance Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
