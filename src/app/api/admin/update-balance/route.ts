
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { wallet, newBalance } = await request.json();
        
        if (!wallet || typeof newBalance !== 'number' || newBalance < 0) {
            return NextResponse.json({ message: 'Wallet address and a valid new balance are required.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { wallet: wallet },
            data: { balance: newBalance },
        });

        if (!updatedUser) {
             return NextResponse.json({ message: `User with wallet ${wallet} not found.` }, { status: 404 });
        }

        return NextResponse.json({ message: `Balance for wallet ${wallet} updated to ${newBalance}.` }, { status: 200 });

    } catch (error: any) {
        // Handle case where user does not exist (P2025)
        if (error.code === 'P2025') {
            return NextResponse.json({ message: `User with wallet ${wallet} not found.` }, { status: 404 });
        }
        console.error('API Update-Balance Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
