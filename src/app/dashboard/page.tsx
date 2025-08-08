
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
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";


const PRESALE_WALLET_ADDRESS = process.env.NEXT_PUBLIC_PRESALE_WALLET;
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // Mainnet


export default function DashboardPage() {
  const { connected, publicKey, disconnect, connecting, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [exnBalance, setExnBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !connecting && !connected) {
      router.push('/');
    }
  }, [isClient, connected, connecting, router]);

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
          setTransactions([]); 
        }
      } catch (error) {
        console.error("Failed to parse transactions from localStorage", error);
        setTransactions([]);
      }
    } else {
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
     if (!PRESALE_WALLET_ADDRESS) {
      toast({ title: "Presale address is not configured. Please contact support.", variant: "destructive" });
      return;
    }

    toast({
      title: "Creating transaction...",
      description: "Please check your wallet to approve.",
    });

    try {
        const presaleWalletPublicKey = new PublicKey(PRESALE_WALLET_ADDRESS);
        const instructions: TransactionInstruction[] = [];
        const memoProgramPublicKey = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcVnuIK2xxavqaHoG38");

        if (currency === "SOL") {
            instructions.push(SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: presaleWalletPublicKey,
                lamports: paidAmount * LAMPORTS_PER_SOL,
            }));
        } else {
            let mintPublicKey: PublicKey;
            let decimals: number;
            
            if (currency === "USDC") {
                mintPublicKey = USDC_MINT;
                decimals = 6; 
            } else if (currency === "USDT") {
                mintPublicKey = USDT_MINT;
                decimals = 6;
            } else {
                throw new Error("Unsupported currency");
            }

            const fromTokenAccount = await getAssociatedTokenAddress(mintPublicKey, publicKey);
            const toTokenAccount = await getAssociatedTokenAddress(mintPublicKey, presaleWalletPublicKey);

            const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
            if (!toTokenAccountInfo) {
                 throw new Error(`Recipient's ${currency} token account does not exist. Please contact support.`);
            }

            instructions.push(
                createTransferInstruction(
                    fromTokenAccount,
                    toTokenAccount,
                    publicKey,
                    paidAmount * (10 ** decimals)
                )
            );
        }

        instructions.push(new TransactionInstruction({
            keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
            programId: memoProgramPublicKey,
            data: Buffer.from(`Purchase ${exnAmount} EXN`, "utf-8"),
        }));
        
        const { blockhash } = await connection.getLatestBlockhash();

        const message = new TransactionMessage({
            payerKey: publicKey,
            recentBlockhash: blockhash,
            instructions: instructions,
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
        
        let errorMessage = "An unknown error occurred.";
        if (error.message) {
            errorMessage = error.message;
        }

        toast({
            title: "Transaction Failed",
            description: errorMessage,
            variant: "destructive",
        });
    }
  };
  
  if (!isClient || connecting || !publicKey) {
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
