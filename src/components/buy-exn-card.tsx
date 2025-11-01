
"use client";

import { useState, useEffect } from "react";
import { ArrowDown, Zap, HelpCircle, TrendingUp, Ticket, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { USDC_MINT } from "@/config";
import { useDashboard } from "./dashboard-client-provider";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Progress } from "./ui/progress";

const SOL_GAS_BUFFER = 0.0009; // Reserve 0.0009 SOL for gas fees
const LISTING_PRICE_PER_EXN = 0.12;


type Currency = "USDC" | "SOL";

export function BuyExnCard() {
  const { connected: isConnected, handlePurchase, tokenPrices, isLoadingPrices, presaleInfo, isPresaleActive, isLoadingPurchase, isHardCapReached, hasPurchasedAuction, auctionSlotsSold } = useDashboard();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [payAmount, setPayAmount] = useState("0");
  const [balances, setBalances] = useState({ SOL: 0, USDC: 0 });
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  
  const purchaseAmountUsd = presaleInfo?.auctionUsdAmount || 50;
  const purchaseAmountExn = presaleInfo?.auctionExnAmount || 50000;
  const totalSlots = presaleInfo?.auctionSlots || 850;
  const isAuctionSoldOut = auctionSlotsSold >= totalSlots;

  const auctionPricePerExn = purchaseAmountUsd && purchaseAmountExn ? purchaseAmountUsd / purchaseAmountExn : 0;
  const progressPercentage = totalSlots > 0 ? (auctionSlotsSold / totalSlots) * 100 : 0;

  
  useEffect(() => {
    const fetchBalances = async () => {
        if (!isConnected || !publicKey) return;
        setIsFetchingBalance(true);
        try {
            const solBalance = await connection.getBalance(publicKey);
            let usdcBalance = 0;
            try {
                const usdcTokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
                const usdcTokenAccountInfo = await connection.getParsedAccountInfo(usdcTokenAccount);
                 if (usdcTokenAccountInfo.value) {
                    usdcBalance = (usdcTokenAccountInfo.value.data as any).parsed.info.tokenAmount.uiAmount;
                }
            } catch (e) {
                console.log("Could not fetch USDC balance for user, likely no account exists yet.");
            }
           
            setBalances({
                SOL: solBalance / LAMPORTS_PER_SOL,
                USDC: usdcBalance,
            });
        } catch (error) {
            console.error("Failed to fetch wallet balances", error);
        }
        setIsFetchingBalance(false);
    };

    fetchBalances();
  }, [isConnected, publicKey, connection]);
  
  useEffect(() => {
    const price = tokenPrices[currency];
    if (price) {
        const amount = purchaseAmountUsd / price;
        setPayAmount(amount.toFixed(currency === 'SOL' ? 5 : 2));
    }
  }, [currency, tokenPrices, purchaseAmountUsd]);


  useEffect(() => {
    const numericPayAmount = parseFloat(payAmount);
    if (isNaN(numericPayAmount)) {
      setBalanceError("");
      return;
    }
    
    const maxBalance = currency === 'SOL' ? balances.SOL - SOL_GAS_BUFFER : balances[currency as keyof typeof balances];

    if (numericPayAmount > maxBalance) {
      setBalanceError(`Insufficient ${currency} balance.`);
    } else if (currency !== 'SOL' && balances.SOL < SOL_GAS_BUFFER) {
      setBalanceError("Insufficient SOL for gas fee.");
    } else {
      setBalanceError("");
    }
  }, [payAmount, currency, balances]);

  const handleBuyNow = () => {
    if (isConnected) {
      handlePurchase(purchaseAmountExn, parseFloat(payAmount), currency);
    }
  };

  const isPurchaseDisabled = !isConnected || isLoadingPrices || !!balanceError || !isPresaleActive || isLoadingPurchase || isHardCapReached || isAuctionSoldOut || hasPurchasedAuction;

  const getButtonText = () => {
    if (hasPurchasedAuction) return "You have already purchased";
    if (isAuctionSoldOut) return "Auction Sold Out";
    if (isHardCapReached) return "Hard Cap Reached";
    if (!isPresaleActive) return "Presale is currently closed";
    if (isLoadingPrices) return 'Loading Prices...';
    if (!isConnected) return "Connect Wallet to Buy";
    if (balanceError) return balanceError;
    if (isLoadingPurchase) return "Processing...";
    return "Buy EXN Now";
  }

  const currentBalance = balances[currency as keyof typeof balances];

  return (
    <div className="w-full rounded-lg border border-border p-6 space-y-4">
      <div className="space-y-1.5">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/20 rounded-md">
                    <Zap className="h-6 w-6 text-primary"/>
                </div>
                <CardTitle className="text-2xl font-bold text-white">Buy EXN Tokens</CardTitle>
            </div>
             <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Ticket className="h-5 w-5" />
                <span>Auction Deal</span>
            </div>
        </div>
        <CardDescription>
            Secure your EXN tokens at a special auction price before the public listing.
        </CardDescription>
      </div>
      
       <div className="space-y-2 pt-2">
         <Progress value={progressPercentage} className="h-2" />
         <div className="flex justify-between text-xs text-muted-foreground">
           <span>Taken: {auctionSlotsSold.toLocaleString()}</span>
           <span>Remaining: {(totalSlots - auctionSlotsSold).toLocaleString()}</span>
         </div>
       </div>

       {hasPurchasedAuction ? (
         <div className="text-center bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 font-bold text-lg">
                <CheckCircle className="h-5 w-5" />
                <p>Congratulations!</p>
            </div>
            <p className="text-sm">You have secured your EXN in the auction. Welcome to the ecosystem!</p>
        </div>
      ) : (
      <div className="space-y-4 pt-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span>You Pay</span>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">
                                    All transactions on the Solana network require a small network fee paid in SOL.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {isConnected && (
                  <span className="text-muted-foreground">
                    Balance: {isFetchingBalance 
                      ? <Skeleton className="h-4 w-16 inline-block" /> 
                      : `${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${currency}`
                    }
                  </span>
                )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold flex-grow">
                {isLoadingPrices ? <Skeleton className="h-8 w-24" /> : `${payAmount} ${currency}`}
                <div className="text-sm font-normal text-muted-foreground">(${purchaseAmountUsd.toFixed(2)} USD)</div>
              </div>
               <Select value={currency} onValueChange={(val) => setCurrency(val as Currency)} disabled={!isPresaleActive || isLoadingPurchase}>
                  <SelectTrigger className="w-[120px] h-auto bg-secondary border-secondary text-white font-medium focus:ring-0">
                    <SelectValue placeholder="Coin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="SOL">SOL</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          {balanceError && <p className="text-xs text-red-400 mt-1 pl-1">{balanceError}</p>}

        <div className="flex justify-center my-2">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>

        <div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="text-white font-medium">EXN</span>
            </div>
            <div className="text-2xl font-bold">{purchaseAmountExn.toLocaleString()}</div>
          </div>
        </div>

        <div className="text-center bg-card p-3 rounded-lg border border-border">
            <div className="flex justify-around items-center">
                <div>
                    <p className="text-xs text-muted-foreground">Auction Price</p>
                    <p className="text-lg font-bold text-primary">${auctionPricePerExn > 0 ? auctionPricePerExn.toPrecision(1) : '...'}</p>
                </div>
                 <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-5 w-5" />
                    <TrendingUp className="h-5 w-5" />
                    <TrendingUp className="h-5 w-5" />
                 </div>
                <div>
                    <p className="text-xs text-muted-foreground">Expected Listing Price</p>
                    <p className="text-lg font-bold text-green-400">${LISTING_PRICE_PER_EXN}</p>
                </div>
            </div>
        </div>
        
      </div>
       )}
      <div className="flex-col gap-4 pt-4">
        <Button 
            size="lg" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-6" 
            disabled={isPurchaseDisabled}
            onClick={handleBuyNow}
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
}

    

    