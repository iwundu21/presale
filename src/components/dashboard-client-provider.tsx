
"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";
import { PRESALE_WALLET_ADDRESS, USDC_MINT, USDT_MINT, EXN_PRICE } from "@/config";
import { getUser, getTransactions, saveTransaction, updateUser } from "@/services/firestore-service";

export type Transaction = {
  id: string;
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
  const { connected, publicKey, connecting, sendTransaction } = useWallet();
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
        const walletAddress = publicKey.toBase58();
        const presaleWalletPublicKey = new PublicKey(PRESALE_WALLET_ADDRESS);

        const [
            userData, 
            userTransactions,
            solPriceData,
            presaleSolBalance, 
            presaleUsdcAccountInfo,
            presaleUsdtAccountInfo
        ] = await Promise.all([
            getUser(walletAddress),
            getTransactions(walletAddress),
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd').then(res => res.json()),
            connection.getBalance(presaleWalletPublicKey),
            connection.getParsedAccountInfo(await getAssociatedTokenAddress(USDC_MINT, presaleWalletPublicKey)).catch(() => null),
            connection.getParsedAccountInfo(await getAssociatedTokenAddress(USDT_MINT, presaleWalletPublicKey)).catch(() => null),
        ]);

        if (userData) {
            setExnBalance(userData.exnBalance);
        } else {
            await updateUser(walletAddress, { walletAddress: walletAddress, exnBalance: 0 });
            setExnBalance(0);
        }
        setTransactions(userTransactions);

        const price = solPriceData.solana.usd;
        setSolPrice(price);
        setIsLoadingPrice(false);

        const solValue = (presaleSolBalance / LAMPORTS_PER_SOL) * price;
        
        let usdcValue = 0;
        if (presaleUsdcAccountInfo?.value) {
            usdcValue = (presaleUsdcAccountInfo.value.data as any).parsed.info.tokenAmount.uiAmount;
        }

        let usdtValue = 0;
        if (presaleUsdtAccountInfo?.value) {
            usdtValue = (presaleUsdtAccountInfo.value.data as any).parsed.info.tokenAmount.uiAmount;
        }

        const totalRaised = solValue + usdcValue + usdtValue;
        setTotalExnSold(totalRaised / EXN_PRICE);

    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
            title: "Error Loading Data",
            description: "Could not load dashboard data. Please refresh the page.",
            variant: "destructive"
        });
        setSolPrice(150);
        setIsLoadingPrice(false);
    } finally {
        setIsLoadingDashboard(false);
    }
  }, [connected, publicKey, connection, toast]);


  useEffect(() => {
    if (connected && publicKey) {
        fetchDashboardData();
    }
  }, [connected, publicKey, fetchDashboardData]);
  
  const updateTransactionInState = useCallback((tx: Transaction) => {
     setTransactions(prev => {
        const index = prev.findIndex(t => t.id === tx.id);
        if (index > -1) {
            const newTxs = [...prev];
            newTxs[index] = tx;
            return newTxs;
        } else {
            return [tx, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime());
        }
    });
  }, []);

  const handlePurchase = useCallback(async (exnAmount: number, paidAmount: number, currency: string) => {
    if (!publicKey) {
      toast({ title: "Wallet not connected", variant: "destructive" });
      return;
    }
     if (!PRESALE_WALLET_ADDRESS) {
      toast({ title: "Presale address is not configured. Please contact support.", variant: "destructive" });
      return;
    }

    const txDetails = { amountExn: exnAmount, paidAmount, paidCurrency: currency, date: new Date() };

    const tempId = `pending-${Date.now()}`;
    const pendingTx: Transaction = {
        id: tempId,
        ...txDetails,
        status: "Pending",
    };
    updateTransactionInState(pendingTx);
    
    // Set a timeout for the pending transaction
    const timeoutId = setTimeout(async () => {
        const failedTx: Transaction = {
            ...pendingTx,
            status: "Failed",
            failureReason: "Transaction timed out after 5 minutes.",
        };
        // We need a stable ID to save to Firestore. Let's use the tempId.
        await saveTransaction(publicKey.toBase58(), failedTx);
        updateTransactionInState(failedTx);
         toast({
            title: "Transaction Timed Out",
            description: "Your transaction was not confirmed within 5 minutes.",
            variant: "destructive",
        });
    }, 5 * 60 * 1000); // 5 minutes

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
        
        toast({
            title: "Confirm in Wallet",
            description: "Please approve the transaction in your wallet.",
        });

        signature = await sendTransaction(transaction, connection);
        clearTimeout(timeoutId); // Clear timeout on successful send
        
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        const completedTx: Transaction = { id: signature, ...txDetails, status: 'Completed' };
        await saveTransaction(publicKey.toBase58(), completedTx);
        
        const newBalance = exnBalance + exnAmount;
        await updateUser(publicKey.toBase58(), { exnBalance: newBalance });
        setExnBalance(newBalance);

        setTransactions(prev => [completedTx, ...prev.filter(tx => tx.id !== tempId)].sort((a,b) => b.date.getTime() - a.date.getTime()));

        toast({
            title: "Purchase Successful!",
            description: `You purchased ${exnAmount.toLocaleString()} EXN.`,
            variant: "success"
        });
        
        fetchDashboardData();

    } catch (error: any) {
        clearTimeout(timeoutId); // Clear timeout on any error
        console.error("Transaction failed:", error);
        
        let failureReason = "An unknown error occurred.";
        let toastTitle = "Transaction Failed";

        if (error.message.includes("User rejected the request")) {
            failureReason = "Transaction was rejected in the wallet.";
            toastTitle = "Transaction Cancelled";
            setTransactions(prev => prev.filter(tx => tx.id !== tempId));
        } else {
             if (error.message) {
                failureReason = error.message;
            }
            if (signature) {
                const failedTx: Transaction = { id: signature, ...txDetails, status: 'Failed', failureReason };
                await saveTransaction(publicKey.toBase58(), failedTx);
                setTransactions(prev => [failedTx, ...prev.filter(tx => tx.id !== tempId)].sort((a,b) => b.date.getTime() - a.date.getTime()));
            } else {
                setTransactions(prev => prev.filter(tx => tx.id !== tempId));
            }
        }
        
        toast({
            title: toastTitle,
            description: failureReason,
            variant: "destructive",
        });
    }
  }, [publicKey, connection, sendTransaction, toast, updateTransactionInState, exnBalance, fetchDashboardData]);
  
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
    isLoadingPrice
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

    