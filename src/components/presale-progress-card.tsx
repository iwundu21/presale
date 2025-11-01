
"use client";

import { Flame } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { useDashboard } from "./dashboard-client-provider";
import { Progress } from "./ui/progress";

const formatNumber = (num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      ...options
    }).format(num);
};

export function PresaleProgressCard() {
    const { totalExnSoldForCurrentStage, presaleInfo } = useDashboard();
    
    const hardCap = presaleInfo?.hardCap || 0;
    const progressPercentage = hardCap > 0 ? (totalExnSoldForCurrentStage / hardCap) * 100 : 0;
    const totalRaised = totalExnSoldForCurrentStage * (presaleInfo?.tokenPrice || 0);

    return (
        <div className="w-full rounded-lg border border-border p-6 space-y-4">
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-md">
                        <Flame className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">{presaleInfo?.seasonName || "Presale"} Progress</CardTitle>
                </div>
                 <CardDescription>
                    The presale is live! Join the revolution.
                </CardDescription>
            </div>
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>{formatNumber(totalExnSoldForCurrentStage, { notation: 'standard' })} EXN Sold</span>
                        <span>{formatNumber(hardCap)} EXN</span>
                    </div>
                </div>

                 <div className="text-center bg-muted/20 p-3 rounded-lg border border-border">
                    <p className="text-sm font-semibold text-white break-all">
                        Total Raised: ${formatNumber(totalRaised, { notation: 'standard', maximumFractionDigits: 0 })}
                    </p>
                 </div>
            </div>
        </div>
    );
}
