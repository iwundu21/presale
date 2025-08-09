
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

async function readDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If the file doesn't exist, start with a default structure
        if (error.code === 'ENOENT') {
            return { totalExnSold: 0, users: {} };
        }
        throw error;
    }
}

async function writeDb(data) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: Request) {
    try {
        const { userKey, exnAmount } = await request.json();

        if (!userKey || typeof exnAmount !== 'number' || exnAmount <= 0) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }

        const db = await readDb();

        // Update user balance
        db.users[userKey] = {
            balance: (db.users[userKey]?.balance || 0) + exnAmount
        };

        // Update total sold
        db.totalExnSold = (db.totalExnSold || 0) + exnAmount;

        await writeDb(db);
        
        return NextResponse.json({ 
            message: 'Purchase successful',
            newBalance: db.users[userKey].balance,
            newTotalSold: db.totalExnSold 
        }, { status: 200 });

    } catch (error) {
        console.error('API Purchase Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
