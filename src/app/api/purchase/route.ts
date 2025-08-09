
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
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return { totalExnSold: 0, users: {} };
        }
        throw error;
    }
}

async function writeDb(data: any) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: Request) {
    try {
        const { userKey, exnAmount, transaction } = await request.json();

        if (!userKey || typeof exnAmount !== 'number' || exnAmount <= 0 || !transaction) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }

        const db = await readDb();

        if (!db.users[userKey]) {
             db.users[userKey] = {
                balance: 0,
                transactions: []
            };
        }

        // Add or update transaction
        const existingTxIndex = db.users[userKey].transactions.findIndex((t: any) => t.id === transaction.id);
        if (existingTxIndex > -1) {
            db.users[userKey].transactions[existingTxIndex] = transaction;
        } else {
            db.users[userKey].transactions.unshift(transaction);
        }

        // Only add to balance and total sold for new, completed transactions
        if (existingTxIndex === -1 && transaction.status === 'Completed') {
            db.users[userKey].balance = (db.users[userKey].balance || 0) + exnAmount;
            db.totalExnSold = (db.totalExnSold || 0) + exnAmount;
        }


        await writeDb(db);
        
        return NextResponse.json({ 
            message: 'Purchase successful',
            newBalance: db.users[userKey].balance,
            newTotalSold: db.totalExnSold,
            transactions: db.users[userKey].transactions,
        }, { status: 200 });

    } catch (error) {
        console.error('API Purchase Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
