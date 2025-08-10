
"use client";

import { Flame, Gift } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { HARD_CAP, SOFT_CAP } from "@/config";
import { useDashboard } from "./dashboard-client-provider";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const formatNumber = (num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      ...options
    }).format(num);
};

export function PresaleProgressCard() {
    const { totalExnSold, presaleInfo } = useDashboard();
    const [progress, setProgress] = useState(0);
    const [totalSoldValue, setTotalSoldValue] = useState(0);
    const [softCapPosition, setSoftCapPosition] = useState(0);

    const exnPrice = presaleInfo?.tokenPrice || 0.09;

    // Effect for updating progress bar
    useEffect(() => {
        const percentage = totalExnSold > 0 && HARD_CAP > 0 ? (totalExnSold / HARD_CAP) * 100 : 0;
        const soldValue = totalExnSold * exnPrice;
        setTotalSoldValue(soldValue);
        
        if (HARD_CAP > 0) {
            setSoftCapPosition((SOFT_CAP / HARD_CAP) * 100);
        }

        // Clamp progress to a max of 100
        setProgress(Math.min(percentage, 100));
    }, [totalExnSold, exnPrice]);

    return (
        <div className="w-full rounded-lg border border-border p-6 space-y-4">
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-md">
                        <Flame className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Presale Progress</CardTitle>
                </div>
                 <CardDescription>
                    The presale is live! Join the revolution.
                </CardDescription>
            </div>
            <div className="space-y-4 pt-4">
                <div className="relative pt-4">
                    <div className="flex items-center gap-3">
                        <Progress value={progress} className="w-full h-3" />
                        <span className="text-sm font-bold text-primary">{progress.toFixed(2)}%</span>
                    </div>
                     {softCapPosition > 0 && (
                        <div className="absolute top-0" style={{ left: `${softCapPosition}%` }}>
                            <div className="h-3 w-0.5 bg-accent/80"></div>
                            <div className="text-xs text-accent -translate-x-1/2 mt-1 whitespace-nowrap">
                                Our Goal
                            </div>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-lg font-bold text-white">{formatNumber(totalExnSold)}</p>
                        <p className="text-xs text-muted-foreground">Tokens Sold</p>
                    </div>
                     <div>
                        <p className="text-lg font-bold text-white">{formatNumber(SOFT_CAP)}</p>
                        <p className="text-xs text-muted-foreground">Soft Cap</p>
                    </div>
                     <div>
                        <p className="text-lg font-bold text-white">{formatNumber(HARD_CAP)}</p>
                        <p className="text-xs text-muted-foreground">Hard Cap</p>
                    </div>
                </div>
                 <div className="text-center bg-muted/20 p-3 rounded-lg border border-border">
                    <p className="text-sm font-semibold text-white">
                        Total Raised: ${formatNumber(totalSoldValue, { notation: 'standard', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Once the Soft Cap is reached, the token launch is guaranteed, regardless of the roadmap progress.
                    </p>
                 </div>
                 <Alert className="border-accent/30 bg-accent/10 text-accent-foreground">
                    <Gift className="h-5 w-5 text-accent" />
                    <AlertTitle className="font-bold text-accent">Presale Bonus!</AlertTitle>
                    <AlertDescription className="text-accent/90">
                       All presale participants will receive a 3% bonus of their total purchased EXN tokens during the final token distribution.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
