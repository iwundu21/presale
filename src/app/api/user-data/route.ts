
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

async function readDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
         if (error.code === 'ENOENT') {
            return { totalExnSold: 0, users: {} };
        }
        throw error;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userKey = searchParams.get('userKey');

        if (!userKey) {
            return NextResponse.json({ message: 'User key is required' }, { status: 400 });
        }

        const db = await readDb();
        const userData = db.users[userKey] || { balance: 0 };
        
        return NextResponse.json(userData, { status: 200 });

    } catch (error) {
        console.error('API User-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
