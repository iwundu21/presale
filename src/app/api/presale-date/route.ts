
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

// Helper to read the entire DB
async function readDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            const defaultEndDate = new Date();
            defaultEndDate.setDate(defaultEndDate.getDate() + 30);
            return { presaleEndDate: defaultEndDate.toISOString() };
        }
        throw error;
    }
}

// Helper to write the entire DB
async function writeDb(data: any) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
    try {
        const db = await readDb();
        return NextResponse.json({ presaleEndDate: db.presaleEndDate });
    } catch (error) {
        console.error('API Presale-Date GET Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
     try {
        const { presaleEndDate } = await request.json();

        if (!presaleEndDate || isNaN(new Date(presaleEndDate).getTime())) {
            return NextResponse.json({ message: 'Invalid date format provided.' }, { status: 400 });
        }

        const db = await readDb();
        db.presaleEndDate = presaleEndDate;
        await writeDb(db);
        
        return NextResponse.json({ 
            message: 'Presale end date updated successfully',
            presaleEndDate: db.presaleEndDate,
        }, { status: 200 });

    } catch (error) {
        console.error('API Presale-Date POST Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
