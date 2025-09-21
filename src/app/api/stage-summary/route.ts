
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { PresaleInfo } from '@/services/presale-info-service';

type StageSummary = {
    stageName: string;
    totalSold: number;
    tokenPrice: number;
};

export async function GET() {
    try {
        // 1. Get all completed transactions
        const completedTransactions = await prisma.transaction.findMany({
            where: { status: 'Completed' },
            select: {
                amountExn: true,
                stageName: true
            }
        });

        if (!completedTransactions.length) {
            return NextResponse.json([], { status: 200 });
        }

        // 2. Define fixed prices for all possible stages.
        // This is more reliable than trying to look up historical prices from the current config.
        const stagePrices: { [key: string]: number } = {
            "Early Stage": 0.09,
            "Investors": 0.15,
            "Whale": 0.25,
        };


        // 3. Group transactions by stageName and sum the amounts
        const summaryMap: { [key: string]: number } = {};
        for (const tx of completedTransactions) {
            if (tx.stageName) {
                if (!summaryMap[tx.stageName]) {
                    summaryMap[tx.stageName] = 0;
                }
                summaryMap[tx.stageName] += tx.amountExn;
            }
        }
        
        // 4. Format the output
        const result: StageSummary[] = Object.entries(summaryMap).map(([stageName, totalSold]) => ({
            stageName,
            totalSold,
            tokenPrice: stagePrices[stageName] || 0.09, // Use recorded price or a default
        }));

        // Sort by a predefined order if possible
        const stageOrder = ["Early Stage", "Investors", "Whale"];
        result.sort((a, b) => stageOrder.indexOf(a.stageName) - stageOrder.indexOf(b.stageName));

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('API Stage-Summary Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
