
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
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { PRESALE_WALLET_ADDRESS, USDC_MINT, USDT_MINT, EXN_PRICE } from "@/config";


export default function DashboardPage() {
  const { connected, publicKey, disconnect, connecting, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [exnBalance, setExnBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [totalExnSold, setTotalExnSold] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !connecting && !connected) {
      router.push('/');
    }
  }, [isClient, connected, connecting, router]);
  
  const fetchPresaleProgress = async () => {
      if (!PRESALE_WALLET_ADDRESS) return;
      try {
        const presaleWalletPublicKey = new PublicKey(PRESALE_WALLET_ADDRESS);

        // Fetch SOL balance
        const solBalance = await connection.getBalance(presaleWalletPublicKey);
        const solPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const solPriceData = await solPriceResponse.json();
        const solPrice = solPriceData.solana.usd;
        const solValue = (solBalance / LAMPORTS_PER_SOL) * solPrice;

        // Fetch USDC balance
        let usdcValue = 0;
        try {
            const usdcTokenAccount = await getAssociatedTokenAddress(USDC_MINT, presaleWalletPublicKey);
            const usdcTokenAccountInfo = await connection.getParsedAccountInfo(usdcTokenAccount);
            if (usdcTokenAccountInfo.value) {
                const usdcBalance = (usdcTokenAccountInfo.value.data as any).parsed.info.tokenAmount.uiAmount;
                usdcValue = usdcBalance;
            }
        } catch(e) {
            console.log("Could not fetch USDC balance, likely no account exists yet.");
        }
        
        // Fetch USDT balance
        let usdtValue = 0;
        try {
            const usdtTokenAccount = await getAssociatedTokenAddress(USDT_MINT, presaleWalletPublicKey);
            const usdtTokenAccountInfo = await connection.getParsedAccountInfo(usdtTokenAccount);
            if (usdtTokenAccountInfo.value) {
                const usdtBalance = (usdtTokenAccountInfo.value.data as any).parsed.info.tokenAmount.uiAmount;
                usdtValue = usdtBalance;
            }
        } catch(e) {
            console.log("Could not fetch USDT balance, likely no account exists yet.");
        }


        const totalRaised = solValue + usdcValue + usdtValue;
        const totalSold = totalRaised / EXN_PRICE;

        setTotalExnSold(totalSold);

      } catch (error) {
          console.error("Failed to fetch presale progress:", error);
      }
  };


  useEffect(() => {
    if (connected && publicKey) {
      fetchPresaleProgress();
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
    const totalBalance = transactions
        .filter(tx => tx.status === 'Completed')
        .reduce((total, tx) => total + tx.amountExn, 0);
    setExnBalance(totalBalance);
  }, [transactions]);

  const updateTransactionStatus = (signature: string, status: "Completed" | "Failed") => {
    setTransactions(prev =>
      prev.map(tx => (tx.id === signature ? { ...tx, status } : tx))
    );
     if (status === 'Completed') {
        fetchPresaleProgress();
    }
  };


  const handlePurchase = async (exnAmount: number, paidAmount: number, currency: string) => {
    if (!publicKey) {
      toast({ title: "Wallet not connected", variant: "destructive" });
      return;
    }
     if (!PRESALE_WALLET_ADDRESS) {
      toast({ title: "Presale address is not configured. Please contact support.", variant: "destructive" });
      return;
    }

    let signature: string | null = null;
    const tempId = `temp-${Date.now()}`;
    
    try {
        const presaleWalletPublicKey = new PublicKey(PRESALE_WALLET_ADDRESS);
        const instructions: TransactionInstruction[] = [];

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
                instructions.push(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        toTokenAccount,
                        presaleWalletPublicKey,
                        mintPublicKey
                    )
                );
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
        
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

        const message = new TransactionMessage({
            payerKey: publicKey,
            recentBlockhash: blockhash,
            instructions: instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(message);

        const newTransaction: Transaction = {
            id: tempId,
            amountExn: exnAmount,
            paidAmount,
            paidCurrency: currency,
            date: new Date(),
            status: "Pending",
        };
        setTransactions((prev) => [newTransaction, ...prev]);

        signature = await sendTransaction(transaction, connection);
        
        setTransactions(prev => prev.map(tx => tx.id === tempId ? { ...tx, id: signature! } : tx));
        
        toast({
            title: "Transaction Sent",
            description: "Waiting for confirmation...",
        });

        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
            throw new Error("Transaction failed to confirm.");
        }

        updateTransactionStatus(signature, "Completed");
        
        toast({
            title: "Purchase Successful!",
            description: `You purchased ${exnAmount.toLocaleString()} EXN.`,
            variant: "success"
        });

    } catch (error: any) {
        console.error("Transaction failed:", error);
        
        const finalId = signature || tempId;
        updateTransactionStatus(finalId, "Failed");

        let errorMessage = "An unknown error occurred.";
        if (error.message.includes("User rejected the request")) {
            errorMessage = "Transaction rejected in wallet.";
        } else if (error.message) {
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
        <PresaleProgressCard totalSold={totalExnSold} />
        <BuyExnCard isConnected={connected} onPurchase={handlePurchase} />
      </div>
      <div className="lg:col-span-3">
        <TransactionHistoryTable transactions={transactions} />
      </div>
    </div>
  );
}
