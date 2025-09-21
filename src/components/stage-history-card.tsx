
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Trophy } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useDashboard } from "./dashboard-client-provider";

type StageSummary = {
    stageName: string;
    totalSold: number;
    tokenPrice: number;
};

const formatNumber = (num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      ...options
    }).format(num);
};

export function StageHistoryCard() {
    const [summary, setSummary] = useState<StageSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { presaleInfo } = useDashboard();
    
    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/stage-summary');
                if (!response.ok) throw new Error("Failed to fetch stage summary");
                const data: StageSummary[] = await response.json();
                
                // Filter out the current stage from the history
                const currentStageName = presaleInfo?.seasonName;
                const historicalData = data.filter(stage => stage.stageName !== currentStageName);
                
                setSummary(historicalData);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        if (presaleInfo) {
            fetchSummary();
        }
    }, [presaleInfo]);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (summary.length === 0) {
        return null; // Don't render the card if there's no historical data
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-md">
                        <Trophy className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle>Completed Stages</CardTitle>
                </div>
                <CardDescription>A summary of performance from previous presale stages.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Stage Name</TableHead>
                            <TableHead className="text-right">Tokens Sold</TableHead>
                            <TableHead className="text-right">Total Raised</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {summary.map((stage) => (
                            <TableRow key={stage.stageName}>
                                <TableCell className="font-medium">{stage.stageName}</TableCell>
                                <TableCell className="text-right">{formatNumber(stage.totalSold)} EXN</TableCell>
                                <TableCell className="text-right">${formatNumber(stage.totalSold * stage.tokenPrice)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
