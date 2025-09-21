
"use client";

import { BuyExnCard } from "@/components/buy-exn-card";
import { PresaleProgressCard } from "@/components/presale-progress-card";
import { DashboardClientProvider } from "@/components/dashboard-client-provider";
import { TransactionHistoryTable } from "@/components/transaction-history-table";
import { BalanceCard } from "@/components/balance-card";
import { StageHistoryCard } from "@/components/stage-history-card";

export default function DashboardPage() {
  return (
    <DashboardClientProvider>
        <div className="space-y-8">
            <BalanceCard />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <PresaleProgressCard />
                    <StageHistoryCard />
                    <BuyExnCard />
                </div>
                <div className="lg:col-span-1">
                   <TransactionHistoryTable />
                </div>
            </div>
        </div>
    </DashboardClientProvider>
  );
}
