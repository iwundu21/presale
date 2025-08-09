
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
            return {};
        }
        throw error;
    }
}

async function writeDb(data: any) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function POST(request: NextRequest) {
    try {
        const { currentPasscode, newPasscode } = await request.json();
        
        if (!currentPasscode || !newPasscode) {
            return NextResponse.json({ message: 'Current and new passcodes are required.' }, { status: 400 });
        }

        const db = await readDb();
        const correctPasscode = db.adminPasscode || process.env.ADMIN_PASSCODE;

        if (!correctPasscode) {
            return NextResponse.json({ message: 'Admin passcode is not configured.' }, { status: 500 });
        }

        if (currentPasscode !== correctPasscode) {
            return NextResponse.json({ message: 'Incorrect current passcode.' }, { status: 403 });
        }

        db.adminPasscode = newPasscode;
        await writeDb(db);

        return NextResponse.json({ message: 'Passcode updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error('API Update-Passcode Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
