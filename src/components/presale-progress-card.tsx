
"use client";

import { Flame } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { HARD_CAP, SOFT_CAP } from "@/config";
import { useDashboard } from "./dashboard-client-provider";

const formatNumber = (num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      ...options
    }).format(num);
};

export function PresaleProgressCard() {
    const { totalExnSold, presaleInfo } = useDashboard();
    const exnPrice = presaleInfo?.tokenPrice || 0.09;
    const totalSoldValue = totalExnSold * exnPrice;

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
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-lg font-bold text-white break-all">{formatNumber(totalExnSold)}</p>
                        <p className="text-xs text-muted-foreground">Tokens Sold</p>
                    </div>
                     <div>
                        <p className="text-lg font-bold text-white break-all">{formatNumber(SOFT_CAP)}</p>
                        <p className="text-xs text-muted-foreground">Soft Cap</p>
                    </div>
                     <div>
                        <p className="text-lg font-bold text-white break-all">{formatNumber(HARD_CAP)}</p>
                        <p className="text-xs text-muted-foreground">Hard Cap</p>
                    </div>
                </div>
                 <div className="text-center bg-muted/20 p-3 rounded-lg border border-border">
                    <p className="text-sm font-semibold text-white break-all">
                        Total Raised: ${formatNumber(totalSoldValue, { notation: 'standard', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Once the Soft Cap is reached, the token launch is guaranteed, regardless of the roadmap progress.
                    </p>
                 </div>
            </div>
        </div>
    );
}

    