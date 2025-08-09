
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

async function readDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return { adminPasscode: null };
        }
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { passcode } = await request.json();
        const db = await readDb();
        
        const correctPasscode = db.adminPasscode || process.env.ADMIN_PASSCODE;

        if (!correctPasscode) {
            console.error("ADMIN_PASSCODE is not set in db.json or environment variables.");
            return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
        }

        if (passcode === correctPasscode) {
            return NextResponse.json({ message: 'Verification successful' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Incorrect passcode.' }, { status: 401 });
        }

    } catch (error) {
        console.error('API Verify-Passcode Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
