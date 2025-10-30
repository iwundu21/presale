
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type UserData = {
    wallet: string;
    balance: number;
};

export async function GET() {
    try {
        // Use a raw query to cast the Decimal to a Float/Double directly in the database.
        // This avoids any issues with Decimal.js serialization in the serverless environment.
        const users = await prisma.$queryRaw<UserData[]>(
            Prisma.sql`SELECT "wallet", "balance"::double precision FROM "User" ORDER BY "wallet" ASC`
        );
        
        return NextResponse.json(users, { status: 200 });

    } catch (error) {
        console.error('API All-Users-Data Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}
