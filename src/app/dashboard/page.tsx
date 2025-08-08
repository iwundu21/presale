
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { WalletConnect } from "@/components/wallet-connect";
import { BuyExnCard } from "@/components/buy-exn-card";
import { TransactionHistoryTable, type Transaction } from "@/components/transaction-history-table";
import { BalanceCard } from "@/components/balance-card";
import { PresaleProgressCard } from "@/components/presale-progress-card";
import { ExnusLogo } from "@/components/icons";
import { useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@/components/ui/skeleton";

const initialTransactions: Transaction[] = [
  {
    id: "txn_3",
    amountExn: 1500,
    paidAmount: 135.0,
    paidCurrency: "USDC",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: "Completed",
  },
  {
    id: "txn_2",
    amountExn: 550,
    paidAmount: 0.25,
    paidCurrency: "SOL",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: "Completed",
  },
  {
    id: "txn_1",
    amountExn: 2000,
    paidAmount: 180.0,
    paidCurrency: "USDT",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    status: "Completed",
  },
];

const calculateTotalBalance = (transactions: Transaction[]) => {
    return transactions.reduce((total, tx) => total + tx.amountExn, 0);
};

function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
       <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <ExnusLogo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-white">Exnus</h1>
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </header>
       <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-white/10">
        © {new Date().getFullYear()} Exnus. All rights reserved.
      </footer>
    </div>
  )
}


export default function DashboardPage() {
  const { connected, publicKey, disconnect, connecting } = useWallet();
  const [exnBalance, setExnBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Wait until the wallet adapter is done connecting
    if (!connecting && !connected) {
      router.push('/');
    }
    if(connected) {
       setTransactions(initialTransactions);
    }
  }, [connected, connecting, router]);

  useEffect(() => {
    const totalBalance = calculateTotalBalance(transactions);
    setExnBalance(totalBalance);
  }, [transactions]);


  const handleDisconnect = async () => {
    await disconnect();
    toast({
      title: "Wallet Disconnected",
    });
    router.push('/');
  };

  const handlePurchase = (exnAmount: number, paidAmount: number, currency: string) => {
    toast({
      title: "Confirm in wallet",
      description: `Please confirm the purchase of ${exnAmount.toLocaleString()} EXN.`,
    });

    // In a real app, you would now construct and send a transaction
    // to your presale program/contract. The user would sign it in their wallet.
    // For this step, we will simulate a successful transaction after a delay.

    setTimeout(() => {
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        amountExn: exnAmount,
        paidAmount,
        paidCurrency: currency,
        date: new Date(),
        status: "Completed",
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      toast({
        title: "Purchase Successful!",
        description: `You purchased ${exnAmount.toLocaleString()} EXN.`,
      });
    }, 2500);
  };
  
  if (connecting || !publicKey) {
      return <DashboardLoadingSkeleton />; 
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <ExnusLogo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-white">Exnus</h1>
          </div>
          <div className="flex items-center gap-6">
            <WalletConnect
              isConnected={connected}
              walletAddress={publicKey.toBase58()}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <BalanceCard balance={exnBalance} />
            <PresaleProgressCard />
            <BuyExnCard isConnected={connected} onPurchase={handlePurchase} />
          </div>
          <div className="lg:col-span-3">
            <TransactionHistoryTable transactions={transactions} />
          </div>
        </div>
      </main>

      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-white/10">
        © {new Date().getFullYear()} Exnus. All rights reserved.
      </footer>
    </div>
  );
}

