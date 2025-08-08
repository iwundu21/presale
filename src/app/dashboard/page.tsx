
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { WalletConnect } from "@/components/wallet-connect";
import { BuyExnCard } from "@/components/buy-exn-card";
import { TransactionHistoryTable, type Transaction } from "@/components/transaction-history-table";
import { ExnusLogo } from "@/components/icons";

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

export default function DashboardPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [exnBalance, setExnBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const connected = localStorage.getItem('walletConnected');
    if (connected === 'true') {
      setIsConnected(true);
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (isConnected) {
      setTransactions(initialTransactions);
      setWalletAddress("4f...dE7m");
    } else {
      setExnBalance(0);
      setTransactions([]);
      setWalletAddress("");
    }
  }, [isConnected]);

  useEffect(() => {
    const totalBalance = calculateTotalBalance(transactions);
    setExnBalance(totalBalance);
  }, [transactions]);


  const handleDisconnect = () => {
    localStorage.removeItem('walletConnected');
    setIsConnected(false);
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

    setTimeout(() => {
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        amountExn,
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
  
  if (!isConnected) {
      return null; // Or a loading spinner
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
            {isConnected && (
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">EXN Balance</p>
                <p className="text-lg font-bold text-primary">{exnBalance.toLocaleString()}</p>
              </div>
            )}
            <WalletConnect
              isConnected={isConnected}
              walletAddress={walletAddress}
              onConnect={() => {}}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2">
            <BuyExnCard isConnected={isConnected} onPurchase={handlePurchase} />
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
