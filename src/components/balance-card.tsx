"use client";

import { useDashboard } from "./dashboard-client-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export function BalanceCard() {
    const { exnBalance } = useDashboard();

    return (
        <Card className="w-full shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
           <CardContent className="p-4 flex items-center justify-between">
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
           </CardContent>
        </Card>
    );
}
