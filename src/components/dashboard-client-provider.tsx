
"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";
import { PRESALE_WALLET_ADDRESS, USDC_MINT, USDT_MINT, HARD_CAP } from "@/config";


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
    handlePurchase: (exnAmount: number, paidAmount: number, currency: string) => Promise<void>;
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

  const fetchDashboardData = useCallback(async () => {
    if (!connected || !publicKey) return;

    setIsLoadingDashboard(true);
    setIsLoadingPrice(true);

    try {
        const userKey = publicKey.toBase58();

        // Fetch user data (balance)
        const userDataRes = await fetch(`/api/user-data?userKey=${userKey}`);
        if (!userDataRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userDataRes.json();
        setExnBalance(userData.balance || 0);

        // Fetch presale data (total sold)
        const presaleDataRes = await fetch('/api/presale-data');
        if (!presaleDataRes.ok) throw new Error('Failed to fetch presale data');
        const presaleData = await presaleDataRes.json();
        setTotalExnSold(presaleData.totalExnSold || 0);

        // Fetch SOL Price
        const solPriceData = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd').then(res => res.json());
        setSolPrice(solPriceData.solana.usd);
        
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
            title: "Error Loading Data",
            description: "Could not load dashboard data. Please refresh.",
            variant: "destructive"
        });
        setSolPrice(150); // Fallback price
    } finally {
        setIsLoadingPrice(false);
        setIsLoadingDashboard(false);
    }
  }, [connected, publicKey, toast]);

   const fetchTransactionHistory = useCallback(async () => {
    if (!publicKey) return;
    // For now, transaction history is local. A full backend would store this.
    // A more robust solution would be to query the blockchain for past transactions.
    const stored = localStorage.getItem(`transactions_${publicKey.toBase58()}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((tx: any) => ({...tx, date: new Date(tx.date)}));
        setTransactions(parsed);
      } catch (e) {
        console.error("Failed to parse transactions from localStorage", e);
        // If parsing fails, clear the corrupted data
        localStorage.removeItem(`transactions_${publicKey.toBase58()}`);
      }
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
        fetchDashboardData();
        fetchTransactionHistory();
    }
  }, [connected, publicKey, fetchDashboardData, fetchTransactionHistory]);
  
  const updateTransactionInState = useCallback((tx: Transaction) => {
     setTransactions(prev => {
        const newTxs = prev.filter(t => t.id !== tx.id);
        newTxs.unshift(tx); // Add new/updated transaction to the top
        newTxs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (publicKey) {
            localStorage.setItem(`transactions_${publicKey.toBase58()}`, JSON.stringify(newTxs));
        }
        return newTxs;
    });
  }, [publicKey]);

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
        
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
            throw new Error(`Transaction failed to confirm: ${JSON.stringify(confirmation.value.err)}`);
        }

        // --- SERVER STATE UPDATE ---
        const userKey = publicKey.toBase58();
        const purchaseResponse = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userKey, exnAmount }),
        });

        if (!purchaseResponse.ok) {
            const errorData = await purchaseResponse.text();
            throw new Error(`Server-side balance update failed: ${errorData}`);
        }

        const { newBalance, newTotalSold } = await purchaseResponse.json();
        setExnBalance(newBalance);
        setTotalExnSold(newTotalSold);
        // --- END SERVER STATE UPDATE ---

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
            description: "Your transaction could not be completed. Your balance has not been charged.",
            variant: "destructive",
        });
    } finally {
        setIsLoadingPurchase(false);
    }
  }, [publicKey, connection, sendTransaction, toast, updateTransactionInState, wallet]);
  
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

    