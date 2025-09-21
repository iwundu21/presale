
"use client";

import { useDashboard } from "./dashboard-client-provider";
import { Wallet } from "lucide-react";
import { CardTitle } from "./ui/card";
import { Button } from "./ui/button";

export function BalanceCard() {
    const { exnBalance } = useDashboard();

    return (
        <div className="w-full rounded-lg border border-border p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Wallet className="h-5 w-5 text-primary"/>
                </div>
                <div>
                    <CardTitle className="text-base font-medium text-muted-foreground">Your Balance</CardTitle>
                    <p className="text-2xl font-bold text-primary">
                        {exnBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} EXN
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <p className="text-xs text-muted-foreground text-right">
                    Token claiming will be enabled at the end of the presale.
                </p>
                <Button disabled>Claim</Button>
            </div>
        </div>
    );
}
