
import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userKey = searchParams.get('userKey');

        if (!userKey) {
            return NextResponse.json({ message: 'User key is required' }, { status: 400 });
        }

        const user = await db.getUser(userKey);

        if (!user) {
            // If user doesn't exist, create a new one to ensure consistency
            const newUser = await db.createUser(userKey);
            return NextResponse.json({
                balance: newUser.balance,
                transactions: newUser.transactions
            }, { status: 200 });
        }
        
        return NextResponse.json({
            balance: user.balance,
            transactions: user.transactions
        }, { status: 200 });

    } catch (error) {
        console.error('API User-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
