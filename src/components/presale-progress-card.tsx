"use client";

import { Flame } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { useDashboard } from "./dashboard-client-provider";

const formatNumber = (num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      ...options
    }).format(num);
};

export function PresaleProgressCard() {
    const { totalExnSoldForCurrentStage, presaleInfo, auctionSlotsSold } = useDashboard();
    
    const auctionUsdAmount = presaleInfo?.auctionUsdAmount || 0;
    const auctionExnAmount = presaleInfo?.auctionExnAmount || 0;
    const totalSoldFromAuction = auctionSlotsSold * auctionExnAmount;
    const totalRaisedFromAuction = auctionSlotsSold * auctionUsdAmount;
    
    const hardCap = presaleInfo?.hardCap || 700000000;
    // This reflects the overall supply remaining for the entire presale
    const remainingTokens = hardCap - totalExnSoldForCurrentStage;


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
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-lg font-bold text-white break-all">{formatNumber(totalSoldFromAuction, { notation: 'standard', maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-muted-foreground">Auction Tokens Sold</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-white break-all">{formatNumber(remainingTokens, { notation: 'standard', maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-muted-foreground">Remaining in Supply</p>
                    </div>
                     <div>
                        <p className="text-lg font-bold text-white break-all">{formatNumber(hardCap)}</p>
                        <p className="text-xs text-muted-foreground">Total Presale Supply</p>
                    </div>
                </div>
                 <div className="text-center bg-muted/20 p-3 rounded-lg border border-border">
                    <p className="text-sm font-semibold text-white break-all">
                        Total Raised from Auction: ${formatNumber(totalRaisedFromAuction, { notation: 'standard', maximumFractionDigits: 0 })}
                    </p>
                 </div>
            </div>
        </div>
    );
}
