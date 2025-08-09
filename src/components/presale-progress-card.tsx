
"use client";

import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { SOFT_CAP, HARD_CAP, EXN_PRICE } from "@/config";
import { useDashboard } from "./dashboard-client-provider";

const formatNumber = (num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      ...options
    }).format(num);
};

export function PresaleProgressCard() {
    const { totalExnSold } = useDashboard();
    const [progress, setProgress] = useState(0);
    const [totalSoldValue, setTotalSoldValue] = useState(0);

    // Effect for updating progress bar
    useEffect(() => {
        const percentage = totalExnSold > 0 && SOFT_CAP > 0 ? (totalExnSold / SOFT_CAP) * 100 : 0;
        const soldValue = totalExnSold * EXN_PRICE;
        setTotalSoldValue(soldValue);
        
        // Clamp progress to a max of 100
        setProgress(Math.min(percentage, 100));
    }, [totalExnSold]);

    return (
        <Card className="w-full shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-md">
                        <Flame className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Presale Progress</CardTitle>
                </div>
                <CardDescription>
                    The presale is live! Join the revolution.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <Progress value={progress} className="w-full h-3" />
                    <span className="text-sm font-bold text-primary">{progress.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-muted-foreground">Sold: <span className="text-white font-bold">{formatNumber(totalExnSold)} EXN</span></span>
                    <span className="text-muted-foreground">Target: <span className="text-white font-bold">{formatNumber(SOFT_CAP)} EXN</span></span>
                </div>
                <div className="text-center">
                   <p className="text-xs text-muted-foreground">Hard Cap: {formatNumber(HARD_CAP)} EXN</p>
                 </div>
                 <div className="text-center">
                    <p className="text-lg font-semibold text-white">
                        ${formatNumber(totalSoldValue, { notation: 'standard', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Raised</p>
                 </div>
            </CardContent>
        </Card>
    );
}
