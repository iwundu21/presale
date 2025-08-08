
"use client";

import { Wallet2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BalanceCardProps = {
  balance: number;
};

export function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <Card className="w-full shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/20 rounded-md">
                    <Wallet2 className="h-6 w-6 text-primary"/>
                </div>
                <CardTitle className="text-2xl font-bold text-white">Your EXN Balance</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-5xl font-bold text-primary tracking-tight">
                {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-muted-foreground mt-1">
                Total EXN tokens purchased.
            </p>
        </CardContent>
    </Card>
  );
}
