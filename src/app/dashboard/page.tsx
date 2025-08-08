"use server";

import { BuyExnCard } from "@/components/buy-exn-card";
import { TransactionHistoryTable } from "@/components/transaction-history-table";
import { BalanceCard } from "@/components/balance-card";
import { PresaleProgressCard } from "@/components/presale-progress-card";
import { DashboardClientProvider } from "@/components/dashboard-client-provider";
import { getPresaleEndDate } from "@/services/presale-date-service";


export default async function DashboardPage() {
  const presaleEndDate = await getPresaleEndDate();
  
  return (
    <DashboardClientProvider presaleEndDate={presaleEndDate}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <BalanceCard />
                <PresaleProgressCard />
                <BuyExnCard />
            </div>
            <div className="lg:col-span-3">
                <TransactionHistoryTable />
            </div>
        </div>
    </DashboardClientProvider>
  );
}
