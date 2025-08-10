
import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET() {
    try {
        const [totalExnSold, presaleInfo, isPresaleActive] = await Promise.all([
            db.getTotalExnSold(),
            db.getConfig('presaleInfo', { seasonName: "Early Stage", tokenPrice: 0.09 }),
            db.getConfig('isPresaleActive', true)
        ]);

        return NextResponse.json({ 
            totalExnSold,
            presaleInfo,
            isPresaleActive,
        }, { status: 200 });
    } catch (error) {
        console.error('API Presale-Data Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
     try {
        const { presaleInfo, isPresaleActive } = await request.json();
        
        if (presaleInfo) {
            if (!presaleInfo.seasonName || typeof presaleInfo.tokenPrice !== 'number') {
                 return NextResponse.json({ message: 'Invalid input for presale info' }, { status: 400 });
            }
            await db.setConfig('presaleInfo', presaleInfo);
        }

        if (typeof isPresaleActive === 'boolean') {
            await db.setConfig('isPresaleActive', isPresaleActive);
        }

        const updatedPresaleInfo = await db.getConfig('presaleInfo', { seasonName: "Early Stage", tokenPrice: 0.09 });
        const updatedIsPresaleActive = await db.getConfig('isPresaleActive', true);
        
        return NextResponse.json({ 
            message: 'Presale data updated successfully',
            presaleInfo: updatedPresaleInfo,
            isPresaleActive: updatedIsPresaleActive,
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Presale-Data POST Error:', error);
        if (error.message.includes('Invalid input')) {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
