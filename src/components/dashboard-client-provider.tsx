

"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction, TransactionSignature } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";
import { PRESALE_WALLET_ADDRESS, USDC_MINT } from "@/config";
import type { PresaleInfo } from "@/services/presale-info-service";
import { v4 as uuidv4 } from 'uuid';

export type Transaction = {
  id: string; // Signature or temporary ID
  amountExn: number;
  paidAmount: number;
  paidCurrency: string;
  date: Date;
  status: "Completed" | "Failed";
  failureReason?: string;
  blockhash?: string;
  lastValidBlockHeight?: number;
};

type TokenPrices = {
    SOL: number | null;
    USDC: number | null;
};

type DashboardContextType = {
    exnBalance: number;
    transactions: Transaction[];
    totalExnSoldForCurrentStage: number;
    connected: boolean;
    handlePurchase: (exnAmount: number, paidAmount: number, currency: string) => Promise<void>;
    tokenPrices: TokenPrices;
    isLoadingPrices: boolean;
    isLoadingPurchase: boolean;
    presaleInfo: PresaleInfo | null;
    isPresaleActive: boolean;
    isHardCapReached: boolean;
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
  const router = useRouter();
  const isMounted = useRef(false);
  const [exnBalance, setExnBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [totalExnSoldForCurrentStage, setTotalExnSoldForCurrentStage] = useState(0);
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({ SOL: null, USDC: null });
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);
  const [presaleInfo, setPresaleInfo] = useState<PresaleInfo | null>(null);
  const [isPresaleActive, setIsPresaleActive] = useState(true);
  
  const isHardCapReached = presaleInfo ? totalExnSoldForCurrentStage >= presaleInfo.hardCap : false;

  useEffect(() => {
    setIsClient(true);
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!connected || !publicKey) return;

    setIsLoadingDashboard(true);
    setIsLoadingPrices(true);

    try {
        const userKey = publicKey.toBase58();

        const [userDataRes, presaleDataRes, pricesRes] = await Promise.allSettled([
            fetch(`/api/user-data?userKey=${userKey}`),
            fetch('/api/presale-data'),
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd')
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
            setTotalExnSoldForCurrentStage(presaleData.totalExnSoldForCurrentStage || 0);
            setPresaleInfo(presaleData.presaleInfo || null);
            setIsPresaleActive(presaleData.isPresaleActive === undefined ? true : presaleData.isPresaleActive);
        } else {
            console.error('Failed to fetch presale data:', presaleDataRes.status === 'rejected' ? presaleDataRes.reason : await presaleDataRes.value.text());
            throw new Error('Could not load presale progress.');
        }
        
        if (pricesRes.status === 'fulfilled' && pricesRes.value.ok) {
            const pricesData = await pricesRes.value.json();
            setTokenPrices({
                SOL: pricesData.solana?.usd || null,
                USDC: pricesData['usd-coin']?.usd || null,
            });
        } else {
            console.error('Failed to fetch token prices:', pricesRes.status === 'rejected' ? pricesRes.reason : 'API request failed');
            setTokenPrices({ SOL: 150, USDC: 1 }); // Fallback prices
            toast({
              title: "Could not fetch token prices",
              description: "Using fallback prices. Conversions may be approximate.",
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
        setIsLoadingPrices(false);
        setIsLoadingDashboard(false);
    }
  }, [connected, publicKey, toast]);


  useEffect(() => {
    if (connected && publicKey) {
        fetchDashboardData();
        
        const intervalId = setInterval(async () => {
            if (!isMounted.current) return;
            try {
                const res = await fetch('/api/presale-data');
                if (isMounted.current && res.ok) {
                    const data = await res.json();
                    setTotalExnSoldForCurrentStage(data.totalExnSoldForCurrentStage || 0);
                }
            } catch (error: any) {
                 if (error.name !== 'AbortError') {
                    console.error("Failed to poll presale data:", error);
                }
            }
        }, 30000); // Poll every 30 seconds

        return () => {
            clearInterval(intervalId);
        };
    }
  }, [connected, publicKey, fetchDashboardData]);
  
  useEffect(() => {
    // If wallet is disconnected, redirect to home page.
    if (isClient && !connected && !connecting) {
        router.push('/');
    }
  }, [isClient, connected, connecting, router]);

  const persistTransaction = useCallback(async (transaction: Transaction) => {
    if (!publicKey) return null;
    try {
        const userKey = publicKey.toBase58();
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userKey, transaction }),
        });

        if (!response.ok) {
            throw new Error(`Server-side transaction update failed: ${await response.text()}`);
        }
        const result = await response.json();

        // Update local state after successful persistence
        if (result) {
            const { newBalance, transactions } = result;
            if (newBalance !== undefined) setExnBalance(newBalance);
            if (transactions) {
                 const parsedTxs = transactions.map((t: any) => ({...t, date: new Date(t.date)}));
                 setTransactions(parsedTxs);
            }
        }
        return result;

    } catch (error) {
        console.error("Failed to persist transaction:", error);
        toast({
            title: "Sync Error",
            description: "Your transaction was processed, but we failed to update your permanent record. Please contact support if your balance seems incorrect.",
            variant: "destructive"
        });
        return null;
    }
  }, [publicKey, toast]);

  const handlePurchase = useCallback(async (exnAmount: number, paidAmount: number, currency: string) => {
    if (!publicKey || !wallet?.adapter.connected || !presaleInfo) {
      toast({ title: "Wallet not connected", description: "Please connect your wallet and try again.", variant: "destructive" });
      return;
    }
    if (!PRESALE_WALLET_ADDRESS) {
      toast({ title: "Presale address is not configured. Please contact support.", variant: "destructive" });
      return;
    }
    if (isHardCapReached) {
        toast({ title: "Hard Cap Reached", description: "The presale has reached its hard cap. No more purchases can be made.", variant: "destructive" });
        return;
    }
    
    setIsLoadingPurchase(true);
    let signature: TransactionSignature | null = null;
    
    try {
        const presaleWalletPublicKey = new PublicKey(PRESALE_WALLET_ADDRESS);
        const instructions: TransactionInstruction[] = [];

        if (currency === "SOL") {
            instructions.push(SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: presaleWalletPublicKey,
                lamports: Math.round(paidAmount * LAMPORTS_PER_SOL),
            }));
        } else { // Assumes "USDC"
            const mintPublicKey = USDC_MINT;
            const decimals = 6;
            const integerAmount = Math.round(paidAmount * (10 ** decimals));

            const fromTokenAccount = await getAssociatedTokenAddress(mintPublicKey, publicKey);
            const toTokenAccount = await getAssociatedTokenAddress(mintPublicKey, presaleWalletPublicKey);
            
            const fromTokenAccountInfo = await connection.getAccountInfo(fromTokenAccount);
            if (!fromTokenAccountInfo) {
                 throw new Error(`You do not have a ${currency} token account. Please create one to proceed.`);
            }

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
                    integerAmount
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

        signature = await sendTransaction(transaction, connection, { skipPreflight: false });
        
        toast({
            title: "Transaction Sent!",
            description: "Processing on-chain. This may take a moment...",
            variant: "success",
        });

        const confirmation = await connection.confirmTransaction({
            signature: signature,
            blockhash: blockhash,
            lastValidBlockHeight: lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
            throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
        }

        const completedTx: Transaction = {
            id: signature,
            amountExn,
            paidAmount,
            paidCurrency: currency,
            date: new Date(),
            status: 'Completed',
            blockhash,
            lastValidBlockHeight,
        };

        await persistTransaction(completedTx);
        
        toast({
            title: "Purchase Successful!",
            description: `You purchased ${exnAmount.toLocaleString()} EXN. Your balance is updated.`,
            variant: "success"
        });
        
    } catch (error: any) {
        console.error("Transaction failed:", error);

        // If user rejects the transaction in the wallet, just show a toast and do nothing else.
        if (error.name === 'WalletSendTransactionError' || (error.message && error.message.includes("User rejected the request"))) {
            toast({
                title: "Transaction Cancelled",
                description: "Transaction was rejected in the wallet.",
                variant: "destructive",
            });
            setIsLoadingPurchase(false);
            return;
        }
        
        // For all other errors (on-chain failure, timeout, etc.), create a failed record.
        let failureReason = "An unknown error occurred.";
        let toastTitle = "Transaction Failed";
        
        if (error.message.includes("timed out") || error.message.includes("Request is not recent enough")) {
             failureReason = "Confirmation timed out. The transaction might have succeeded or failed. Please check your balance and history.";
             toastTitle = "Transaction Timed Out";
        } else if (error.message) {
             failureReason = error.message;
        }

        const failedTx: Transaction = {
            id: signature || `tx_${uuidv4()}`,
            amountExn,
            paidAmount,
            paidCurrency: currency,
            date: new Date(),
            status: 'Failed',
            failureReason,
        };
        await persistTransaction(failedTx);
        
        toast({
            title: toastTitle,
            description: failureReason,
            variant: "destructive",
        });
    } finally {
        setIsLoadingPurchase(false);
    }
  }, [publicKey, connection, sendTransaction, toast, wallet, persistTransaction, isHardCapReached, presaleInfo]);
  
  if (!isClient || connecting || (!connected && isClient)) {
      return <DashboardLoadingSkeleton />; 
  }
  
  const contextValue = {
    exnBalance,
    transactions,
    totalExnSoldForCurrentStage,
    connected,
    handlePurchase,
    tokenPrices,
    isLoadingPrices,
    isLoadingPurchase,
    presaleInfo,
    isPresaleActive,
    isHardCapReached,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
