
"use client";

import { useDashboard } from "./dashboard-client-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export function BalanceCard() {
    const { exnBalance } = useDashboard();

    return (
        <Card className="w-full shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-primary/20 rounded-md">
                        <Wallet className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Your Balance</CardTitle>
                </div>
                 <CardDescription>
                    The total amount of EXN tokens you hold.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold text-primary">
                    {exnBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} EXN
                </p>
            </CardContent>
        </Card>
    );
}
