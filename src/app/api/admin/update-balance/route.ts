
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { withLock } from '@/lib/file-lock';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

async function readDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
         if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return { users: {} };
        }
        throw error;
    }
}

async function writeDb(data: any) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function POST(request: NextRequest) {
    try {
        const { wallet, newBalance } = await request.json();
        
        if (!wallet || typeof newBalance !== 'number' || newBalance < 0) {
            return NextResponse.json({ message: 'Wallet address and a valid new balance are required.' }, { status: 400 });
        }

        await withLock(async () => {
            const db = await readDb();
            
            if (!db.users || !db.users[wallet]) {
                throw new Error(`User with wallet ${wallet} not found.`);
            }

            db.users[wallet].balance = newBalance;
            await writeDb(db);
        });

        return NextResponse.json({ message: `Balance for wallet ${wallet} updated to ${newBalance}.` }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Balance Error:', error);
        if (error.message.includes('not found')) {
            return NextResponse.json({ message: error.message }, { status: 404 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
