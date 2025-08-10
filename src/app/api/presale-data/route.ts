
import { NextResponse } from 'next/server';
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
            // Default structure if db.json doesn't exist
            return { 
                totalExnSold: 0, 
                users: {},
                presaleInfo: {
                    seasonName: "Early Stage",
                    tokenPrice: 0.09
                },
                isPresaleActive: true
            };
        }
        throw error;
    }
}

async function writeDb(data: any) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function GET() {
    try {
        const db = await readDb();
        return NextResponse.json({ 
            totalExnSold: db.totalExnSold || 0,
            presaleInfo: db.presaleInfo || { seasonName: "Early Stage", tokenPrice: 0.09 },
            isPresaleActive: db.isPresaleActive === undefined ? true : db.isPresaleActive,
        }, { status: 200 });
    } catch (error) {
        console.error('API Presale-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
     try {
        const { presaleInfo, isPresaleActive } = await request.json();
        let updatedData;

        await withLock(async () => {
            const db = await readDb();

            if (presaleInfo) {
                if (!presaleInfo.seasonName || typeof presaleInfo.tokenPrice !== 'number') {
                     throw new Error('Invalid input for presale info');
                }
                db.presaleInfo = presaleInfo;
            }

            if (typeof isPresaleActive === 'boolean') {
                db.isPresaleActive = isPresaleActive;
            }

            await writeDb(db);
            updatedData = {
                presaleInfo: db.presaleInfo,
                isPresaleActive: db.isPresaleActive,
            };
        });
        
        return NextResponse.json({ 
            message: 'Presale data updated successfully',
            ...updatedData,
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Presale-Data POST Error:', error);
        if (error.message.includes('Invalid input')) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
