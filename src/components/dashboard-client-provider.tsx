
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
    } else {
        setTransactions([]);
        setExnBalance(0);
        setTotalExnSold(0);
    }
  }, [connected, publicKey, fetchDashboardData]);
  
  const updateTransactionStatus = useCallback(async (signature: string, status: "Completed" | "Failed", txDetails: Omit<Transaction, 'status' | 'id' | 'date'>) => {
    if (!publicKey) return;

    const finalTransaction: Transaction = {
        id: signature,
        ...txDetails,
        date: new Date(),
        status
    };
     
    // Save to Firestore
    await saveTransaction(publicKey.toBase58(), finalTransaction);
     
    if (status === 'Completed') {
        const newBalance = exnBalance + txDetails.amountExn;
        setExnBalance(newBalance);
        await updateUser(publicKey.toBase58(), { exnBalance: newBalance });
        // Re-fetch presale progress to show latest numbers
        fetchDashboardData();
    }
    
    // Update local state to reflect change immediately
    const otherTransactions = transactions.filter(tx => tx.id !== signature && !tx.id.startsWith('pending-'));
    setTransactions([finalTransaction, ...otherTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()));

  }, [publicKey, exnBalance, transactions, fetchDashboardData]);


  const handlePurchase = useCallback(async (exnAmount: number, paidAmount: number, currency: string) => {
    if (!publicKey) {
      toast({ title: "Wallet not connected", variant: "destructive" });
      return;
    }
     if (!PRESALE_WALLET_ADDRESS) {
      toast({ title: "Presale address is not configured. Please contact support.", variant: "destructive" });
      return;
    }

    let signature: string | null = null;
    
    // Optimistically create pending transaction for UI
    const pendingTx: Transaction = {
        id: `pending-${Date.now()}-${exnAmount}`, // Use a unique temporary ID
        amountExn: exnAmount,
        paidAmount,
        paidCurrency: currency,
        date: new Date(),
        status: "Pending",
    };
    setTransactions((prev) => [pendingTx, ...prev]);
    
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
        signature = await sendTransaction(transaction, connection);
        
        // Remove pending tx
        setTransactions(prev => prev.filter(tx => tx.id !== pendingTx.id));
        
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

        await updateTransactionStatus(signature, "Completed", {amountExn, paidAmount, paidCurrency});
        
        toast({
            title: "Purchase Successful!",
            description: `You purchased ${exnAmount.toLocaleString()} EXN.`,
            variant: "success"
        });

    } catch (error: any) {
        console.error("Transaction failed:", error);
        
        // Remove pending transaction from UI
        setTransactions(prev => prev.filter(tx => tx.id !== pendingTx.id));

        if (signature) {
          // If we have a signature, the tx was sent but failed to confirm or process
          await updateTransactionStatus(signature, "Failed", {amountExn, paidAmount, paidCurrency});
        }

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
  }, [publicKey, connection, sendTransaction, toast, updateTransactionStatus]);
  
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
