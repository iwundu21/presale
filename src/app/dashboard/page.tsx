
"use client";

import { BuyExnCard } from "@/components/buy-exn-card";
import { PresaleProgressCard } from "@/components/presale-progress-card";
import { DashboardClientProvider } from "@/components/dashboard-client-provider";

export default function DashboardPage() {
  return (
    <DashboardClientProvider>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <PresaleProgressCard />
                <BuyExnCard />
            </div>
            <div className="lg:col-span-1">
               {/* Transaction History Removed */}
            </div>
        </div>
    </DashboardClientProvider>
  );
}
