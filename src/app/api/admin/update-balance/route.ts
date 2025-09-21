

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateBalanceSchema = z.object({
  wallet: z.string().min(1),
  newBalance: z.number().min(0),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, newBalance } = updateBalanceSchema.parse(body);

        // Find the user to ensure they exist
        const user = await prisma.user.findUnique({
            where: { wallet: wallet },
        });

        if (!user) {
            throw new Error(`User with wallet ${wallet} not found.`);
        }
        
        // Update the user's balance
        await prisma.user.update({
            where: { wallet: wallet },
            data: { balance: newBalance },
        });

        return NextResponse.json({ message: `Balance for wallet ${wallet} updated to ${newBalance}. Total sold will reflect this change automatically.` }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Balance Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input.', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
