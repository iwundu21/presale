
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { BuyExnCard } from "@/components/buy-exn-card";
import { TransactionHistoryTable, type Transaction } from "@/components/transaction-history-table";
import { BalanceCard } from "@/components/balance-card";
import { PresaleProgressCard } from "@/components/presale-progress-card";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";


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

  useEffect(() => {
    if (connected && publicKey) {
      const storageKey = `exn_transactions_${publicKey.toBase58()}`;
      try {
        const storedTransactions = localStorage.getItem(storageKey);
        if (storedTransactions) {
          const parsed = JSON.parse(storedTransactions);
          const transactionsWithDates = parsed.map((tx: any) => ({
            ...tx,
            date: new Date(tx.date)
          }));
          setTransactions(transactionsWithDates);
        } else {
          setTransactions([]); // New user, empty history
        }
      } catch (error) {
        console.error("Failed to parse transactions from localStorage", error);
        setTransactions([]);
      }
    } else {
        // Not connected, show empty state or default
        setTransactions([]);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (connected && publicKey && transactions.length > 0) {
      const storageKey = `exn_transactions_${publicKey.toBase58()}`;
      localStorage.setItem(storageKey, JSON.stringify(transactions));
    }
  }, [transactions, connected, publicKey]);


  useEffect(() => {
    const totalBalance = transactions.reduce((total, tx) => total + tx.amountExn, 0);
    setExnBalance(totalBalance);
  }, [transactions]);

  const handlePurchase = async (exnAmount: number, paidAmount: number, currency: string) => {
    if (!publicKey) {
      toast({ title: "Wallet not connected", variant: "destructive" });
      return;
    }

    toast({
      title: "Creating transaction...",
      description: "Please check your wallet to approve.",
    });

    try {
        const recipientAddress = process.env.NEXT_PUBLIC_PRESALE_WALLET;
        if (!recipientAddress) {
          toast({ title: "Configuration Error", description: "Presale wallet address is not configured.", variant: "destructive" });
          console.error("Presale wallet address is not set in .env file");
          return;
        }

        let presaleWalletPublicKey: PublicKey;
        let memoProgramPublicKey: PublicKey;
        try {
            presaleWalletPublicKey = new PublicKey(recipientAddress);
            // Memo Program v1 address.
            memoProgramPublicKey = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcVnuIK2xxavqaHoG38");
        } catch (error) {
            toast({ title: "Configuration Error", description: "An invalid public key was found in the configuration.", variant: "destructive" });
            console.error("Invalid public key:", error);
            return;
        }

        const transferInstruction = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: presaleWalletPublicKey,
            lamports: paidAmount * LAMPORTS_PER_SOL,
        });

        const memoInstruction = new TransactionInstruction({
            keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
            programId: memoProgramPublicKey,
            data: Buffer.from(`Purchase ${exnAmount} EXN`, "utf-8"),
        });

        const { blockhash } = await connection.getLatestBlockhash();

        const message = new TransactionMessage({
            payerKey: publicKey,
            recentBlockhash: blockhash,
            instructions: [transferInstruction, memoInstruction],
        }).compileToV0Message();

        const transaction = new VersionedTransaction(message);

        const signature = await sendTransaction(transaction, connection);

        await connection.confirmTransaction(signature, 'processed');

        const newTransaction: Transaction = {
            id: signature,
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
            variant: "default"
        });

    } catch (error: any) {
        console.error("Transaction failed:", error);
        toast({
            title: "Transaction Failed",
            description: error.message || "An unknown error occurred.",
            variant: "destructive",
        });
    }
  };
  
  if (connecting || !publicKey) {
      return <DashboardLoadingSkeleton />; 
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <BalanceCard balance={exnBalance} />
        <PresaleProgressCard userPurchasedAmount={exnBalance} />
        <BuyExnCard isConnected={connected} onPurchase={handlePurchase} />
      </div>
      <div className="lg:col-span-3">
        <TransactionHistoryTable transactions={transactions} />
      </div>
    </div>
  );
}
