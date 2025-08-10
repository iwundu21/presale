
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

        await withLock(async () => {
            const db = await readDb();
            const correctPasscode = db.adminPasscode || process.env.ADMIN_PASSCODE;

            if (!correctPasscode) {
                throw new Error('Admin passcode is not configured.');
            }

            if (currentPasscode !== correctPasscode) {
                throw new Error('Incorrect current passcode.');
            }

            db.adminPasscode = newPasscode;
            await writeDb(db);
        });

        return NextResponse.json({ message: 'Passcode updated successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('API Update-Passcode Error:', error);
        if (error.message.includes('not configured')) {
             return NextResponse.json({ message: error.message }, { status: 500 });
        }
        if (error.message.includes('Incorrect current passcode')) {
             return NextResponse.json({ message: error.message }, { status: 403 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
