
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function POST(request: NextRequest) {
    try {
        const isBonusDistributed = await db.getConfig('bonusDistributed', false);

        if (isBonusDistributed) {
            return NextResponse.json({ message: 'Bonus has already been distributed.' }, { status: 400 });
        }

        const { updatedCount } = await db.distributeBonus();

        return NextResponse.json({ 
            message: `Successfully distributed 3% bonus to ${updatedCount} users.`,
            updatedCount: updatedCount 
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Distribute-Bonus Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const isBonusDistributed = await db.getConfig('bonusDistributed', false);
        return NextResponse.json({ isBonusDistributed }, { status: 200 });
    } catch (error) {
        console.error('API Distribute-Bonus GET Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
