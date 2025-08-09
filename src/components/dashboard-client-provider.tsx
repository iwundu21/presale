
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

        // --- Start fetching all data in parallel ---
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
        // --- All parallel fetching ends ---

        // Process User Data
        if (userData) {
            setExnBalance(userData.exnBalance);
        } else {
            await updateUser(walletAddress, { walletAddress: walletAddress, exnBalance: 0 });
            setExnBalance(0);
        }
        setTransactions(userTransactions);

        // Process SOL Price
        const price = solPriceData.solana.usd;
        setSolPrice(price);
        setIsLoadingPrice(false);

        // Process Presale Progress
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
        setSolPrice(150); // Set fallback
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
            // Update existing transaction
            const newTxs = [...prev];
            newTxs[index] = tx;
            return newTxs;
        } else {
            // Add new transaction
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

    // Use a unique temporary ID for the optimistic update
    const tempId = `pending-${Date.now()}`;
    const pendingTx: Transaction = {
        id: tempId,
        ...txDetails,
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
                        publicKey, // Payer
                        toTokenAccount, // Associated Token Account
                        presaleWalletPublicKey, // Owner
                        mintPublicKey // Mint
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
        
        // The UI already shows "Pending", we wait for confirmation
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

        // Replace pending tx with completed one
        setTransactions(prev => [completedTx, ...prev.filter(tx => tx.id !== tempId)].sort((a,b) => b.date.getTime() - a.date.getTime()));

        toast({
            title: "Purchase Successful!",
            description: `You purchased ${exnAmount.toLocaleString()} EXN.`,
            variant: "success"
        });
        
        // Re-fetch total presale progress
        fetchDashboardData();

    } catch (error: any) {
        console.error("Transaction failed:", error);
        
        let errorMessage = "An unknown error occurred.";
        if (error.message.includes("User rejected the request")) {
            errorMessage = "Transaction rejected in wallet.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        // If we have a signature, the transaction was sent but failed to process.
        // It's a failed transaction and should be recorded.
        if (signature) {
            const failedTx: Transaction = { id: signature, ...txDetails, status: 'Failed' };
            await saveTransaction(publicKey.toBase58(), failedTx);
            // Replace pending tx with failed one
            setTransactions(prev => [failedTx, ...prev.filter(tx => tx.id !== tempId)].sort((a,b) => b.date.getTime() - a.date.getTime()));
        } else {
             // If there's no signature, the transaction was never even sent (e.g., user rejected).
             // We can just remove the pending transaction from the UI.
            setTransactions(prev => prev.filter(tx => tx.id !== tempId));
        }

        toast({
            title: "Transaction Failed",
            description: errorMessage,
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
