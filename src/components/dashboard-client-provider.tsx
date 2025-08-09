
"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction, TransactionSignature } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";
import { PRESALE_WALLET_ADDRESS, USDC_MINT, USDT_MINT, HARD_CAP } from "@/config";
import type { PresaleInfo } from "@/services/presale-info-service";

export type Transaction = {
  id: string; // Signature or temp ID
  amountExn: number;
  paidAmount: number;
  paidCurrency: string;
  date: Date;
  status: "Completed" | "Pending" | "Failed";
  failureReason?: string;
  blockhash?: string;
  lastValidBlockHeight?: number;
};

type DashboardContextType = {
    exnBalance: number;
    transactions: Transaction[];
    totalExnSold: number;
    connected: boolean;
    handlePurchase: (exnAmount: number, paidAmount: number, currency: string) => Promise<void>;
    retryTransaction: (tx: Transaction) => Promise<void>;
    solPrice: number | null;
    isLoadingPrice: boolean;
    isLoadingPurchase: boolean;
    presaleInfo: PresaleInfo | null;
    isPresaleActive: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}

type DashboardClientProviderProps = {
    children: React.ReactNode;
};

const TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function DashboardClientProvider({ children }: DashboardClientProviderProps) {
  const { connected, publicKey, connecting, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const [exnBalance, setExnBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [totalExnSold, setTotalExnSold] = useState(0);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);
  const [presaleInfo, setPresaleInfo] = useState<PresaleInfo | null>(null);
  const [isPresaleActive, setIsPresaleActive] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !connecting && !connected) {
      router.push('/');
    }
  }, [isClient, connected, connecting, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!connected || !publicKey) return;

    setIsLoadingDashboard(true);
    setIsLoadingPrice(true);

    try {
        const userKey = publicKey.toBase58();

        const [userDataRes, presaleDataRes, solPriceRes] = await Promise.allSettled([
            fetch(`/api/user-data?userKey=${userKey}`),
            fetch('/api/presale-data'),
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
        ]);

        if (userDataRes.status === 'fulfilled' && userDataRes.value.ok) {
            const userData = await userDataRes.value.json();
            setExnBalance(userData.balance || 0);
            if(userData.transactions) {
                const parsedTxs = userData.transactions.map((tx: any) => ({...tx, date: new Date(tx.date)}));
                setTransactions(parsedTxs);
            }
        } else {
             console.error('Failed to fetch user data:', userDataRes.status === 'rejected' ? userDataRes.reason : await userDataRes.value.text());
             throw new Error('Could not load your balance.');
        }

        if (presaleDataRes.status === 'fulfilled' && presaleDataRes.value.ok) {
            const presaleData = await presaleDataRes.value.json();
            setTotalExnSold(presaleData.totalExnSold || 0);
            setPresaleInfo(presaleData.presaleInfo || null);
            setIsPresaleActive(presaleData.isPresaleActive === undefined ? true : presaleData.isPresaleActive);
        } else {
            console.error('Failed to fetch presale data:', presaleDataRes.status === 'rejected' ? presaleDataRes.reason : await presaleDataRes.value.text());
            throw new Error('Could not load presale progress.');
        }
        
        if (solPriceRes.status === 'fulfilled' && solPriceRes.value.ok) {
            const solPriceData = await solPriceRes.value.json();
            setSolPrice(solPriceData.solana.usd);
        } else {
            console.error('Failed to fetch SOL price:', solPriceRes.status === 'rejected' ? solPriceRes.reason : 'API request failed');
            setSolPrice(150); 
            toast({
              title: "Could not fetch SOL price",
              description: "Using a fallback price. SOL conversions may be approximate.",
              variant: "destructive"
            });
        }
        
    } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
            title: "Error Loading Data",
            description: error.message || "Could not load dashboard data. Please refresh.",
            variant: "destructive"
        });
    } finally {
        setIsLoadingPrice(false);
        setIsLoadingDashboard(false);
    }
  }, [connected, publicKey, toast]);


  useEffect(() => {
    if (connected && publicKey) {
        fetchDashboardData();
    }
  }, [connected, publicKey, fetchDashboardData]);
  
  const updateTransactionInState = useCallback((tx: Transaction) => {
     setTransactions(prev => {
        const newTxs = prev.filter(t => t.id !== tx.id);
        newTxs.unshift(tx);
        newTxs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return newTxs;
    });
  }, []);

  const persistTransaction = useCallback(async (transaction: Transaction) => {
    if (!publicKey) return;
    try {
        const userKey = publicKey.toBase58();
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userKey, exnAmount: transaction.amountExn, transaction }),
        });

        if (!response.ok) {
            throw new Error(`Server-side transaction update failed: ${await response.text()}`);
        }
        const { newBalance, newTotalSold, transactions } = await response.json();

        setExnBalance(newBalance);
        setTotalExnSold(newTotalSold);
        const parsedTxs = transactions.map((tx: any) => ({...tx, date: new Date(tx.date)}));
        setTransactions(parsedTxs);

    } catch (error) {
        console.error("Failed to persist transaction:", error);
        toast({
            title: "Sync Error",
            description: "Your transaction was successful, but we failed to update your permanent record. Please contact support if your balance seems incorrect.",
            variant: "destructive"
        });
    }
  }, [publicKey, toast]);

  const confirmAndFinalizeTransaction = useCallback(async (tx: Transaction) => {
    if (!tx.blockhash || !tx.lastValidBlockHeight) return;

    try {
        const confirmation = await connection.confirmTransaction({
            signature: tx.id,
            blockhash: tx.blockhash,
            lastValidBlockHeight: tx.lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
            throw new Error(`Transaction failed to confirm: ${JSON.stringify(confirmation.value.err)}`);
        }

        const completedTx: Transaction = { ...tx, status: 'Completed' };
        updateTransactionInState(completedTx);
        await persistTransaction(completedTx);

        toast({
            title: "Purchase Successful!",
            description: `You purchased ${tx.amountExn.toLocaleString()} EXN. Your balance is updated.`,
            variant: "success"
        });

    } catch (error: any) {
        console.error("Transaction finalization failed:", error);
        
        const failedTx: Transaction = { ...tx, status: 'Failed', failureReason: "Failed to confirm on-chain." };
        updateTransactionInState(failedTx);
        await persistTransaction(failedTx);
        
        toast({
            title: "Transaction Failed",
            description: "Your transaction could not be confirmed on the blockchain.",
            variant: "destructive",
        });
    }
  }, [connection, persistTransaction, toast, updateTransactionInState]);

  const handlePurchase = useCallback(async (exnAmount: number, paidAmount: number, currency: string) => {
    if (!publicKey || !wallet?.adapter.connected) {
      toast({ title: "Wallet not connected", description: "Please connect your wallet and try again.", variant: "destructive" });
      return;
    }
    if (!PRESALE_WALLET_ADDRESS) {
      toast({ title: "Presale address is not configured. Please contact support.", variant: "destructive" });
      return;
    }
    
    setIsLoadingPurchase(true);

    const tempId = `tx_${Date.now()}`;
    let newTx: Transaction = { 
        id: tempId,
        amountExn: exnAmount, 
        paidAmount, 
        paidCurrency: currency, 
        date: new Date(),
        status: "Pending",
    };
    
    updateTransactionInState(newTx);

    let signature: TransactionSignature | null = null;
    let blockhash: string | null = null;
    let lastValidBlockHeight: number | null = null;

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
            const mintPublicKey = currency === "USDC" ? USDC_MINT : USDT_MINT;
            const decimals = 6;

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
        
        const latestBlockhash = await connection.getLatestBlockhash();
        blockhash = latestBlockhash.blockhash;
        lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

        const message = new TransactionMessage({
            payerKey: publicKey,
            recentBlockhash: blockhash,
            instructions: instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(message);
        
        toast({
            title: "Confirm in Wallet",
            description: "Please approve the transaction in your wallet.",
        });

        signature = await sendTransaction(transaction, connection);
        
        newTx = {...newTx, id: signature, blockhash, lastValidBlockHeight};
        updateTransactionInState(newTx);
        await persistTransaction(newTx); // Persist pending transaction immediately

        toast({
            title: "Transaction Sent!",
            description: "Your purchase is being processed. This may take a few moments.",
            variant: "success",
        });

        // Start polling for confirmation without blocking UI
        confirmAndFinalizeTransaction(newTx);
        
    } catch (error: any) {
        console.error("Transaction failed:", error);
        
        let failureReason = "An unknown error occurred.";
        let toastTitle = "Transaction Failed";
        
        if (error.name === 'WalletSendTransactionError' || (error.message && error.message.includes("User rejected the request"))) {
            failureReason = "Transaction was rejected in the wallet.";
            toastTitle = "Transaction Cancelled";
        } else if (error.message.includes("timed out")) {
             failureReason = "Confirmation timed out. The transaction might have succeeded or failed. Please check the transaction on Solscan or try retrying.";
             toastTitle = "Transaction Timed Out";
        } else if (error.message) {
             failureReason = error.message;
        }

        const finalId = signature || tempId;
        const failedTx: Transaction = { ...newTx, id: finalId, status: 'Failed', failureReason, blockhash: blockhash, lastValidBlockHeight: lastValidBlockHeight };
        
        updateTransactionInState(failedTx);
        await persistTransaction(failedTx);
        
        toast({
            title: toastTitle,
            description: "Your transaction could not be completed. Your balance has not been charged for failed transactions.",
            variant: "destructive",
        });
    } finally {
        setIsLoadingPurchase(false);
    }
  }, [publicKey, connection, sendTransaction, toast, updateTransactionInState, wallet, persistTransaction, confirmAndFinalizeTransaction]);
  
  const retryTransaction = useCallback(async (tx: Transaction) => {
    if (tx.id.startsWith('tx_') || !tx.blockhash || !tx.lastValidBlockHeight) {
        toast({ title: "Retry Unavailable", description: "This transaction cannot be retried yet.", variant: "destructive" });
        return;
    }

    setIsLoadingPurchase(true);
    toast({ title: "Retrying Transaction...", description: "Re-checking confirmation status..."});
    
    try {
        const confirmationPromise = connection.confirmTransaction({
          signature: tx.id,
          blockhash: tx.blockhash,
          lastValidBlockHeight: tx.lastValidBlockHeight
        }, 'confirmed');

        // Shorter timeout for retry
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Retry confirmation timed out.")), 30000));

        const confirmation = await Promise.race([confirmationPromise, timeoutPromise]);
        
        if ((confirmation as any).value.err) {
            throw new Error(`Transaction failed to confirm on retry: ${JSON.stringify((confirmation as any).value.err)}`);
        }

        const completedTx: Transaction = { ...tx, status: 'Completed' };
        updateTransactionInState(completedTx);
        await persistTransaction(completedTx);
        
        toast({ title: "Retry Successful!", description: "Your transaction has been confirmed.", variant: "success" });

    } catch (error: any) {
        console.error("Retry failed:", error);
        // Don't immediately fail the transaction on retry timeout, just inform the user
        if (error.message.includes("timed out")) {
             toast({ title: "Retry Timed Out", description: "Still pending. Please check Solscan or try again in a moment.", variant: "destructive" });
        } else {
            const failedTx: Transaction = { ...tx, status: 'Failed', failureReason: error.message };
            updateTransactionInState(failedTx);
            await persistTransaction(failedTx);
            toast({ title: "Transaction Failed", description: error.message, variant: "destructive" });
        }
    } finally {
        setIsLoadingPurchase(false);
    }

  }, [connection, toast, updateTransactionInState, persistTransaction]);
  
   // Effect to auto-fail pending transactions after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date().getTime();
        transactions.forEach(tx => {
            if (tx.status === 'Pending' && (now - new Date(tx.date).getTime()) > TRANSACTION_TIMEOUT_MS) {
                const failedTx: Transaction = {
                    ...tx,
                    status: 'Failed',
                    failureReason: 'Transaction timed out after 5 minutes.'
                };
                updateTransactionInState(failedTx);
                persistTransaction(failedTx);
                 toast({
                    title: "Transaction Timed Out",
                    description: `Transaction ${tx.id.substring(0,8)}... has been marked as failed.`,
                    variant: "destructive",
                });
            }
        });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [transactions, updateTransactionInState, persistTransaction, toast]);


  if (!isClient || connecting || !publicKey || isLoadingDashboard) {
      return <DashboardLoadingSkeleton />; 
  }

  const contextValue = {
    exnBalance,
    transactions,
    totalExnSold,
    connected,
    handlePurchase,
    retryTransaction,
    solPrice,
    isLoadingPrice,
    isLoadingPurchase,
    presaleInfo,
    isPresaleActive,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
