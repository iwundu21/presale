
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const findTransactionSchema = z.object({
  txId: z.string().min(1, 'Transaction ID cannot be empty.'),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const txId = searchParams.get('txId');

        const validation = findTransactionSchema.safeParse({ txId });

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid input.', details: validation.error.errors }, { status: 400 });
        }

        const transaction = await prisma.transaction.findUnique({
            where: {
                id: validation.data.txId,
            },
            include: {
                user: {
                    select: {
                        wallet: true
                    }
                }
            }
        });

        if (!transaction) {
            return NextResponse.json({ message: `Transaction with ID "${txId}" not found.` }, { status: 404 });
        }

        return NextResponse.json(transaction, { status: 200 });

    } catch (error: any) {
        console.error('API Find-Transaction Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
