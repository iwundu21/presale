
"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";
import { PRESALE_WALLET_ADDRESS, USDC_MINT, USDT_MINT, HARD_CAP } from "@/config";

// Local storage keys
const EXN_BALANCE_KEY = "exnus_exn_balance";
const TOTAL_EXN_SOLD_KEY = "exnus_total_exn_sold";
const TRANSACTIONS_KEY = "exnus_transactions";

export type Transaction = {
  id: string; // Signature or temp ID
  amountExn: number;
  paidAmount: number;
  paidCurrency: string;
  date: Date;
  status: "Completed" | "Pending" | "Failed";
  failureReason?: string;
};

type DashboardContextType = {
    exnBalance: number;
    transactions: Transaction[];
    totalExnSold: number;
    connected: boolean;
    handlePurchase: (exnAmount: number, paidAmount: number, currency: string, retryFromId?: string) => Promise<void>;
    solPrice: number | null;
    isLoadingPrice: boolean;
    isLoadingPurchase: boolean;
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !connecting && !connected) {
      router.push('/');
    }
  }, [isClient, connected, connecting, router]);
  
  const getStoredData = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key);
        if (item) {
            try {
                // The date objects need to be reconstructed
                const parsed = JSON.parse(item);
                if(Array.isArray(parsed)) {
                    return parsed.map(t => ({...t, date: new Date(t.date)}));
                }
                return parsed;
            } catch(e) {
                return null;
            }
        }
    }
    return null;
  }, []);

  const setStoredData = (key: string, data: any) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
    }
  }
  
  const fetchDashboardData = useCallback(async () => {
    if (!connected || !publicKey) return;

    setIsLoadingDashboard(true);
    setIsLoadingPrice(true);

    try {
        // Fetch SOL Price
        const solPriceData = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd').then(res => res.json());
        setSolPrice(solPriceData.solana.usd);
        
        const userKey = publicKey.toBase58();
        setExnBalance(getStoredData(`${EXN_BALANCE_KEY}_${userKey}`) || 0);
        setTotalExnSold(getStoredData(TOTAL_EXN_SOLD_KEY) || 0);
        
        // Load transactions from local storage for this user
        const storedTransactions = getStoredData(`${TRANSACTIONS_KEY}_${userKey}`) || [];
        setTransactions(storedTransactions);

    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
            title: "Error Loading Data",
            description: "Could not load real-time market data. Please refresh.",
            variant: "destructive"
        });
        setSolPrice(150); // Fallback price
    } finally {
        setIsLoadingPrice(false);
        setIsLoadingDashboard(false);
    }
  }, [connected, publicKey, toast, getStoredData]);


  useEffect(() => {
    if (connected && publicKey) {
        fetchDashboardData();
    }
  }, [connected, publicKey, fetchDashboardData]);
  
  const updateTransactionInState = useCallback((tx: Transaction) => {
     setTransactions(prev => {
        const newTxs = prev.filter(t => t.id !== tx.id);
        newTxs.unshift(tx); // Add new/updated transaction to the top
        newTxs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (publicKey) {
            setStoredData(`${TRANSACTIONS_KEY}_${publicKey.toBase58()}`, newTxs);
        }
        return newTxs;
    });
  }, [publicKey]);

  const handlePurchase = useCallback(async (exnAmount: number, paidAmount: number, currency: string, retryFromId?: string) => {
    if (!publicKey || !wallet) {
      toast({ title: "Wallet not connected", variant: "destructive" });
      return;
    }
     if (!PRESALE_WALLET_ADDRESS) {
      toast({ title: "Presale address is not configured. Please contact support.", variant: "destructive" });
      return;
    }
    
    setIsLoadingPurchase(true);

    const tempId = retryFromId || `tx_${Date.now()}`;
    const txDetails: Omit<Transaction, 'status' | 'id' | 'date'> = { 
        amountExn: exnAmount, 
        paidAmount, 
        paidCurrency: currency, 
    };

    const pendingTx: Transaction = {
        id: tempId,
        ...txDetails,
        date: new Date(),
        status: "Pending",
    };
    
    updateTransactionInState(pendingTx);

    let signature: string | null = null;
    
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
            const decimals = 6; // Both USDC and USDT use 6 decimals

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
        
        toast({
            title: "Confirm in Wallet",
            description: "Please approve the transaction in your wallet.",
        });

        signature = await sendTransaction(transaction, connection);
        
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        // --- LOCAL STATE UPDATE ---
        const userKey = publicKey.toBase58();
        const newBalance = (exnBalance || 0) + exnAmount;
        const newTotalSold = (totalExnSold || 0) + exnAmount;
        
        setStoredData(`${EXN_BALANCE_KEY}_${userKey}`, newBalance);
        setStoredData(TOTAL_EXN_SOLD_KEY, newTotalSold);

        setExnBalance(newBalance);
        setTotalExnSold(newTotalSold);
        // --- END LOCAL STATE UPDATE ---

        const completedTx: Transaction = { id: signature, ...txDetails, status: 'Completed', date: new Date() };
        updateTransactionInState(completedTx); 

        toast({
            title: "Purchase Successful!",
            description: `You purchased ${exnAmount.toLocaleString()} EXN. Your balance is updated.`,
            variant: "success"
        });
        
    } catch (error: any) {
        console.error("Transaction failed:", error);
        
        let failureReason = "An unknown error occurred.";
        let toastTitle = "Transaction Failed";
        
        if (error.name === 'WalletSendTransactionError' || (error.message && error.message.includes("User rejected the request"))) {
            failureReason = "Transaction was rejected in the wallet.";
            toastTitle = "Transaction Cancelled";
        } else if (error.message) {
             failureReason = error.message;
        }

        const finalId = signature || tempId;
        const failedTx: Transaction = { id: finalId, ...txDetails, status: 'Failed', failureReason, date: new Date() };
        
        updateTransactionInState(failedTx);
        
        toast({
            title: toastTitle,
            description: "Your transaction could not be completed. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsLoadingPurchase(false);
    }
  }, [publicKey, connection, sendTransaction, toast, updateTransactionInState, wallet, exnBalance, totalExnSold, setStoredData]);
  
  if (!isClient || connecting || !publicKey || isLoadingDashboard) {
      return <DashboardLoadingSkeleton />; 
  }

  const contextValue = {
    exnBalance,
    transactions,
    totalExnSold,
    connected,
    handlePurchase,
    solPrice,
    isLoadingPrice,
    isLoadingPurchase,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
