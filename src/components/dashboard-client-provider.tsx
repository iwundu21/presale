
"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";
import { PRESALE_WALLET_ADDRESS, USDC_MINT, USDT_MINT, EXN_PRICE } from "@/config";

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !connecting && !connected) {
      router.push('/');
    }
  }, [isClient, connected, connecting, router]);
  
  const fetchPresaleProgress = useCallback(async () => {
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
            console.log("Could not fetch USDC balance for presale wallet, likely no account exists yet.");
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
            console.log("Could not fetch USDT balance for presale wallet, likely no account exists yet.");
        }

        const totalRaised = solValue + usdcValue + usdtValue;
        const totalSold = totalRaised / EXN_PRICE;

        setTotalExnSold(totalSold);

      } catch (error) {
          console.error("Failed to fetch presale progress:", error);
      }
  }, [connection]);


  const fetchUserData = useCallback(async () => {
    if (connected && publicKey) {
        fetchPresaleProgress();
        // In a real app, you'd fetch data from a backend here.
        // For this simplified version, we just reset state on wallet change.
        setExnBalance(0);
        setTransactions([]);
    } else {
        setTransactions([]);
        setExnBalance(0);
    }
  }, [connected, publicKey, fetchPresaleProgress]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  const updateTransactionStatus = useCallback(async (signature: string, status: "Completed" | "Failed", txDetails: Omit<Transaction, 'status' | 'id' | 'date'>) => {
    if (!publicKey) return;

    const finalTransaction: Transaction = {
        id: signature,
        ...txDetails,
        date: new Date(),
        status
    };
     
    if (status === 'Completed') {
        const newBalance = exnBalance + txDetails.amountExn;
        setExnBalance(newBalance);
        fetchPresaleProgress();
    }
    
    // Update local state to reflect change immediately
    const otherTransactions = transactions.filter(tx => tx.id !== signature && !tx.id.startsWith('pending-'));
    setTransactions([finalTransaction, ...otherTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()));

  }, [publicKey, exnBalance, transactions, fetchPresaleProgress]);


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
        
        setTransactions(prev => prev.filter(tx => tx.id !== pendingTx.id));

        if (signature) {
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
  
  if (!isClient || connecting || !publicKey) {
      return <DashboardLoadingSkeleton />; 
  }

  const contextValue = {
    exnBalance,
    transactions,
    totalExnSold,
    connected,
    handlePurchase,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
