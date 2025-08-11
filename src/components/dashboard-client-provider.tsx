
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
import { v4 as uuidv4 } from 'uuid';

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
  balanceAdded?: boolean;
};

type TokenPrices = {
    SOL: number | null;
    USDC: number | null;
    USDT: number | null;
};

type DashboardContextType = {
    exnBalance: number;
    transactions: Transaction[];
    totalExnSold: number;
    connected: boolean;
    handlePurchase: (exnAmount: number, paidAmount: number, currency: string) => Promise<void>;
    retryTransaction: (tx: Transaction) => Promise<void>;
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

export const TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for on-chain confirmation

export function DashboardClientProvider({ children }: DashboardClientProviderProps) {
  const { connected, publicKey, connecting, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const [exnBalance, setExnBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [totalExnSold, setTotalExnSold] = useState(0);
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({ SOL: null, USDC: null, USDT: null });
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false);
  const [presaleInfo, setPresaleInfo] = useState<PresaleInfo | null>(null);
  const [isPresaleActive, setIsPresaleActive] = useState(true);
  
  const isHardCapReached = totalExnSold >= HARD_CAP;

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
    setIsLoadingPrices(true);

    try {
        const userKey = publicKey.toBase58();

        const [userDataRes, presaleDataRes, pricesRes] = await Promise.allSettled([
            fetch(`/api/user-data?userKey=${userKey}`),
            fetch('/api/presale-data'),
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin,tether&vs_currencies=usd')
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
        
        if (pricesRes.status === 'fulfilled' && pricesRes.value.ok) {
            const pricesData = await pricesRes.value.json();
            setTokenPrices({
                SOL: pricesData.solana?.usd || null,
                USDC: pricesData['usd-coin']?.usd || null,
                USDT: pricesData.tether?.usd || null,
            });
        } else {
            console.error('Failed to fetch token prices:', pricesRes.status === 'rejected' ? pricesRes.reason : 'API request failed');
            setTokenPrices({ SOL: 150, USDC: 1, USDT: 1 }); // Fallback prices
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
        
        const abortController = new AbortController();
        const signal = abortController.signal;

        const intervalId = setInterval(async () => {
            try {
                const res = await fetch('/api/presale-data', { signal });
                if (!signal.aborted && res.ok) {
                    const data = await res.json();
                    setTotalExnSold(data.totalExnSold || 0);
                }
            } catch (error: any) {
                 if (error.name !== 'AbortError') {
                    console.error("Failed to poll presale data:", error);
                }
            }
        }, 30000); // Poll every 30 seconds

        return () => {
            abortController.abort();
            clearInterval(intervalId);
        };
    }
  }, [connected, publicKey, fetchDashboardData]);
  
  const updateTransactionInState = useCallback((tx: Transaction) => {
     setTransactions(prev => {
        const existingIndex = prev.findIndex(t => t.id === tx.id);
        
        let newTxs;
        if (existingIndex !== -1) {
            newTxs = [...prev];
            newTxs[existingIndex] = tx;
        } else {
            newTxs = [tx, ...prev];
        }

        newTxs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return newTxs;
    });
  }, []);


  const persistTransaction = useCallback(async (transaction: Transaction, tempTxId?: string) => {
    if (!publicKey) return null;
    try {
        const userKey = publicKey.toBase58();
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userKey, exnAmount: transaction.amountExn, transaction, tempTxId }),
        });

        if (!response.ok) {
            throw new Error(`Server-side transaction update failed: ${await response.text()}`);
        }
        return await response.json();

    } catch (error) {
        console.error("Failed to persist transaction:", error);
        toast({
            title: "Sync Error",
            description: "Your transaction was successful, but we failed to update your permanent record. Please contact support if your balance seems incorrect.",
            variant: "destructive"
        });
        return null;
    }
  }, [publicKey, toast]);

  const confirmAndFinalizeTransaction = useCallback(async (tx: Transaction, signature: string) => {
    if (!tx.blockhash || !tx.lastValidBlockHeight) return;

    try {
        const confirmation = await connection.confirmTransaction({
            signature: signature,
            blockhash: tx.blockhash,
            lastValidBlockHeight: tx.lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
            throw new Error(`Transaction failed to confirm: ${JSON.stringify(confirmation.value.err)}`);
        }

        const completedTx: Transaction = { ...tx, status: 'Completed', failureReason: "Transaction successfully confirmed on-chain.", balanceAdded: false };
        updateTransactionInState(completedTx);
        
        const result = await persistTransaction(completedTx);
        if (result) {
            const { newBalance, newTotalSold, transactions } = result;
            if (newBalance !== undefined) setExnBalance(newBalance);
            if (newTotalSold !== undefined) setTotalExnSold(newTotalSold);
            if (transactions) {
                 const parsedTxs = transactions.map((t: any) => ({...t, date: new Date(t.date)}));
                 setTransactions(parsedTxs);
            }
        }

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
    if (isHardCapReached) {
        toast({ title: "Hard Cap Reached", description: "The presale has reached its hard cap. No more purchases can be made.", variant: "destructive" });
        return;
    }
    
    setIsLoadingPurchase(true);

    const tempTxId = `temp_${uuidv4()}`;
    let signature: TransactionSignature | null = null;
    let confirmationTimeout: NodeJS.Timeout | null = null;

    // Create a pending transaction immediately
    const pendingTx: Transaction = {
        id: tempTxId,
        amountExn,
        paidAmount,
        paidCurrency: currency,
        date: new Date(),
        status: "Pending",
        failureReason: "Awaiting confirmation from wallet...",
        balanceAdded: false,
    };
    updateTransactionInState(pendingTx);
    await persistTransaction(pendingTx);
    
    // Set a timeout to handle user inaction
    confirmationTimeout = setTimeout(() => {
        const timedOutTx: Transaction = {
            ...pendingTx,
            status: 'Failed',
            failureReason: 'User did not confirm in wallet within 5 minutes.'
        };
        updateTransactionInState(timedOutTx);
        persistTransaction(timedOutTx);
        toast({
            title: "Transaction Timed Out",
            description: "You did not confirm the transaction in your wallet.",
            variant: "destructive"
        });
        setIsLoadingPurchase(false);
    }, TRANSACTION_TIMEOUT_MS);
    
    try {
        const presaleWalletPublicKey = new PublicKey(PRESALE_WALLET_ADDRESS);
        const instructions: TransactionInstruction[] = [];

        if (currency === "SOL") {
            instructions.push(SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: presaleWalletPublicKey,
                lamports: Math.round(paidAmount * LAMPORTS_PER_SOL),
            }));
        } else {
            const mintPublicKey = currency === "USDC" ? USDC_MINT : USDT_MINT;
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
                        publicKey, // Payer funds the account creation
                        toTokenAccount,
                        presaleWalletPublicKey, // Owner of the new account
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

        signature = await sendTransaction(transaction, connection);
        
        // If we get a signature, the user has approved. Clear the timeout.
        if (confirmationTimeout) {
            clearTimeout(confirmationTimeout);
            confirmationTimeout = null;
        }
        
        const signedTxState: Transaction = { 
            ...pendingTx, 
            id: signature, 
            blockhash, 
            lastValidBlockHeight, 
            failureReason: 'Processing on-chain...' 
        };
        
        // Update the client state record from temp to signed
        setTransactions(prev => prev.map(t => t.id === tempTxId ? signedTxState : t));

        // Update the database record from temp to signed
        await persistTransaction(signedTxState, tempTxId); 

        toast({
            title: "Transaction Sent!",
            description: "Your purchase is being processed. This may take a few moments.",
            variant: "success",
        });

        await confirmAndFinalizeTransaction(signedTxState, signature);
        
    } catch (error: any) {
        if (confirmationTimeout) {
            clearTimeout(confirmationTimeout);
        }
        console.error("Transaction failed:", error);
        
        let failureReason = "An unknown error occurred.";
        let toastTitle = "Transaction Failed";
        
        if (error.name === 'WalletSendTransactionError' || (error.message && error.message.includes("User rejected the request"))) {
            failureReason = "Transaction was rejected in the wallet.";
            toastTitle = "Transaction Cancelled";
        } else if (error.message.includes("timed out") || error.message.includes("Request is not recent enough")) {
             failureReason = "Confirmation timed out. The transaction might have succeeded or failed. Please check the transaction on Solscan or try retrying.";
             toastTitle = "Transaction Timed Out";
        } else if (error.message) {
             failureReason = error.message;
        }
        
        const failedTx: Transaction = {
            ...pendingTx,
            id: signature || tempTxId, // Use signature if available, otherwise tempId
            status: 'Failed',
            failureReason
        };
        
        updateTransactionInState(failedTx);
        await persistTransaction(failedTx, signature ? undefined : tempTxId);
        
        toast({
            title: toastTitle,
            description: failureReason,
            variant: "destructive",
        });
    } finally {
        setIsLoadingPurchase(false);
    }
  }, [publicKey, connection, sendTransaction, toast, updateTransactionInState, wallet, persistTransaction, confirmAndFinalizeTransaction, isHardCapReached]);
  
  const retryTransaction = useCallback(async (tx: Transaction) => {
    if (tx.status !== 'Pending' || tx.id.startsWith('temp_') || !tx.blockhash || !tx.lastValidBlockHeight) {
        toast({ title: "Retry Unavailable", description: "This transaction cannot be retried from here.", variant: "destructive" });
        return;
    }

    const timeSinceCreation = new Date().getTime() - new Date(tx.date).getTime();
    if (timeSinceCreation > TRANSACTION_TIMEOUT_MS) {
        const failedTx: Transaction = {
            ...tx,
            status: 'Failed',
            failureReason: 'Transaction expired before it could be confirmed.'
        };
        updateTransactionInState(failedTx);
        persistTransaction(failedTx);
        toast({ title: "Transaction Expired", description: "This transaction can no longer be confirmed.", variant: "destructive" });
        return;
    }
    
    toast({ title: "Checking status...", description: "Re-checking latest status of your transaction."});
    
    confirmAndFinalizeTransaction(tx, tx.id);

  }, [toast, connection, updateTransactionInState, persistTransaction, confirmAndFinalizeTransaction]);
  
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date().getTime();
        transactions.forEach(tx => {
            if (tx.status === 'Pending' && (now - new Date(tx.date).getTime()) > TRANSACTION_TIMEOUT_MS) {
                if (tx.id.startsWith('temp_')) {
                    // This case is already handled by the user inaction timeout in handlePurchase
                    return;
                }
                
                // This handles on-chain confirmation timeouts for transactions that were sent
                if (tx.blockhash) {
                    const failedTx: Transaction = {
                        ...tx,
                        status: 'Failed',
                        failureReason: 'On-chain confirmation timed out after 5 minutes.'
                    };
                    updateTransactionInState(failedTx);
                    persistTransaction(failedTx);
                }
            }
        });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [transactions, updateTransactionInState, persistTransaction]);


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
