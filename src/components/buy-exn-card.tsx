
"use client";

import { useState, useEffect } from "react";
import { ArrowDown, Zap, HelpCircle, TrendingUp } from "lucide-react";
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

const SOL_GAS_BUFFER = 0.0009; // Reserve 0.0009 SOL for gas fees
const PURCHASE_AMOUNT_USD = 50;
const PURCHASE_AMOUNT_EXN = 50000;
const MAX_PURCHASE_USD = 5000;
const AUCTION_PRICE_PER_EXN = PURCHASE_AMOUNT_USD / PURCHASE_AMOUNT_EXN;
const LISTING_PRICE_PER_EXN = 0.094;


type Currency = "USDC" | "SOL";

export function BuyExnCard() {
  const { connected: isConnected, handlePurchase, tokenPrices, isLoadingPrices, presaleInfo, isPresaleActive, isLoadingPurchase, isHardCapReached, exnBalance } = useDashboard();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [payAmount, setPayAmount] = useState("0");
  const [balances, setBalances] = useState({ SOL: 0, USDC: 0 });
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [limitError, setLimitError] = useState("");

  const exnPrice = presaleInfo?.tokenPrice || 0.09; // This is now the "value" price, not purchase price
  const userTotalInvestedUSD = exnBalance * exnPrice;
  const hasReachedMax = userTotalInvestedUSD >= MAX_PURCHASE_USD;
  
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
        const amount = PURCHASE_AMOUNT_USD / price;
        setPayAmount(amount.toFixed(currency === 'SOL' ? 5 : 2));
    }
  }, [currency, tokenPrices]);


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

  useEffect(() => {
    const totalFutureInvestment = userTotalInvestedUSD + PURCHASE_AMOUNT_USD;

    if (totalFutureInvestment > MAX_PURCHASE_USD) {
        setLimitError(`Purchase exceeds wallet limit of $${MAX_PURCHASE_USD}.`);
    } else {
        setLimitError("");
    }
  }, [userTotalInvestedUSD]);


  const handleBuyNow = () => {
    if (isConnected) {
      handlePurchase(PURCHASE_AMOUNT_EXN, parseFloat(payAmount), currency);
    }
  };

  const currentBalance = balances[currency as keyof typeof balances];
  const isPurchaseDisabled = !isConnected || isLoadingPrices || !!balanceError || !!limitError || !isPresaleActive || isLoadingPurchase || isHardCapReached || hasReachedMax;

  const getButtonText = () => {
    if (hasReachedMax) return "Maximum contribution reached";
    if (isHardCapReached) return "Hard Cap Reached";
    if (!isPresaleActive) return "Presale is currently closed";
    if (isLoadingPrices) return 'Loading Prices...';
    if (!isConnected) return "Connect Wallet to Buy";
    if (limitError) return limitError;
    if (balanceError) return balanceError;
    if (isLoadingPurchase) return "Processing...";
    return "Buy EXN Now";
  }

  const currentPrice = tokenPrices[currency];

  return (
    <div className="w-full rounded-lg border border-border p-6 space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/20 rounded-md">
                <Zap className="h-6 w-6 text-primary"/>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Buy EXN Tokens</CardTitle>
        </div>
        <CardDescription>
            Your Total Contribution: <strong>${userTotalInvestedUSD.toLocaleString(undefined, {maximumFractionDigits: 2})} / ${MAX_PURCHASE_USD.toLocaleString()}</strong>
        </CardDescription>
      </div>
      
       {hasReachedMax ? (
         <div className="text-center bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg mt-4">
            <p className="font-bold">Congratulations!</p>
            <p className="text-sm">You have reached the maximum contribution limit for this wallet.</p>
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
                <div className="text-sm font-normal text-muted-foreground">(${PURCHASE_AMOUNT_USD.toFixed(2)} USD)</div>
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
          {limitError ? (
            <p className="text-xs text-red-400 mt-1 pl-1">{limitError}</p>
          ) : balanceError ? (
            <p className="text-xs text-red-400 mt-1 pl-1">{balanceError}</p>
          ): null}

        <div className="flex justify-center my-2">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>

        <div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="text-white font-medium">EXN</span>
            </div>
            <div className="text-2xl font-bold">{PURCHASE_AMOUNT_EXN.toLocaleString()}</div>
          </div>
        </div>

        <div className="text-center bg-card p-3 rounded-lg border border-border">
            <div className="flex justify-around items-center">
                <div>
                    <p className="text-xs text-muted-foreground">Auction Price</p>
                    <p className="text-lg font-bold text-primary">${AUCTION_PRICE_PER_EXN.toPrecision(1)}</p>
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
