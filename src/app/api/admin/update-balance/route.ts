
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

        const updatedUser = await prisma.user.update({
            where: { wallet: wallet },
            data: { balance: newBalance },
        });

        if (!updatedUser) {
             return NextResponse.json({ message: `User with wallet ${wallet} not found.` }, { status: 404 });
        }

        return NextResponse.json({ message: `Balance for wallet ${wallet} updated to ${newBalance}.` }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Balance Error:', error);
        if (error.code === 'P2025') { // Prisma code for record not found on update
            return NextResponse.json({ message: `User with wallet not found.` }, { status: 404 });
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid input.', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
