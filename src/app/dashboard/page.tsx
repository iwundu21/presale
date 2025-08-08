
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
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";


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

const PRESALE_WALLET_ADDRESS = "CXLV1AX6kY3y7isprh7wYd9g6g1GYkLdAjT25ytE1tE1";

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
  const { connected, publicKey, disconnect, connecting, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [exnBalance, setExnBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!connecting && !connected) {
      router.push('/');
    }
  }, [connected, connecting, router]);

  // Load transactions from localStorage when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      const storageKey = `exn_transactions_${publicKey.toBase58()}`;
      try {
        const storedTransactions = localStorage.getItem(storageKey);
        if (storedTransactions) {
          const parsed = JSON.parse(storedTransactions);
          // Ensure dates are parsed correctly
          const transactionsWithDates = parsed.map((tx: any) => ({
            ...tx,
            date: new Date(tx.date)
          }));
          setTransactions(transactionsWithDates);
        } else {
          // New user, start with an empty list
          setTransactions([]);
        }
      } catch (error) {
        console.error("Failed to parse transactions from localStorage", error);
        setTransactions([]);
      }
    } else {
      // Not connected, show initial example transactions
      setTransactions(initialTransactions);
    }
  }, [connected, publicKey]);

  // Save transactions to localStorage whenever they change for a connected wallet
  useEffect(() => {
    if (connected && publicKey && transactions !== initialTransactions) {
      const storageKey = `exn_transactions_${publicKey.toBase58()}`;
      localStorage.setItem(storageKey, JSON.stringify(transactions));
    }
  }, [transactions, connected, publicKey]);


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

  const handlePurchase = async (exnAmount: number, paidAmount: number, currency: string) => {
    if (!publicKey) {
        toast({ title: "Wallet not connected", variant: "destructive" });
        return;
    }

    if (currency !== 'SOL') {
        toast({ title: "Only SOL payments are supported in this demo", variant: "destructive" });
        return;
    }

    toast({
        title: "Creating transaction...",
        description: "Please confirm in your wallet.",
    });

    try {
        const latestBlockhash = await connection.getLatestBlockhash();
        
        const MEMO_PROGRAM_ID_STRING = "MemoSq4gqABAXKb96qnH8TysNcVnuIK2xxavqaHoG38";

        const transferInstruction = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(PRESALE_WALLET_ADDRESS),
            lamports: paidAmount * LAMPORTS_PER_SOL,
        });
        
        const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_ID_STRING),
            data: Buffer.from(`Exnus Presale: ${exnAmount.toLocaleString()} EXN`, "utf-8"),
        });

        const message = new TransactionMessage({
            payerKey: publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: [transferInstruction, memoInstruction],
        }).compileToV0Message();
        
        const transaction = new VersionedTransaction(message);
        
        const signature = await sendTransaction(transaction, connection);
        
        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature,
        });

        const newTransaction: Transaction = {
            id: signature,
            amountExn: exnAmount,
            paidAmount,
            paidCurrency: currency,
            date: new Date(),
            status: "Completed",
        };
        // Add new transaction to the start of the list
        setTransactions((prev) => [newTransaction, ...prev]);

        toast({
            title: "Purchase Successful!",
            description: `You purchased ${exnAmount.toLocaleString()} EXN. Tx: ${signature.substring(0,10)}...`,
            variant: "default"
        });

    } catch (error: any) {
        console.error("Purchase failed", error);
        toast({
            title: "Purchase Failed",
            description: error?.message || "An unknown error occurred.",
            variant: "destructive",
        });
    }
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
