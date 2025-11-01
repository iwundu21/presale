
"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDown, Zap, HelpCircle } from "lucide-react";
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
import { Input } from "./ui/input";

const SOL_GAS_BUFFER = 0.0009; // Reserve 0.0009 SOL for gas fees
const LISTING_PRICE_PER_EXN = 0.12;
const MIN_PURCHASE_USD = 50;
const MAX_PURCHASE_USD_TOTAL = 5000;


type Currency = "USDC" | "SOL";

export function BuyExnCard() {
  const { connected: isConnected, handlePurchase, tokenPrices, isLoadingPrices, presaleInfo, isPresaleActive, isLoadingPurchase, isHardCapReached, totalUSDPurchased } = useDashboard();
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const [currency, setCurrency] = useState<Currency>("USDC");
  const [payAmount, setPayAmount] = useState("");
  const [exnAmount, setExnAmount] = useState("");

  const [balances, setBalances] = useState({ SOL: 0, USDC: 0 });
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [purchaseLimitError, setPurchaseLimitError] = useState("");
  
  const tokenPrice = presaleInfo?.tokenPrice || 0.09;
  
  // Pre-fill with minimum purchase amount
  useEffect(() => {
    if (tokenPrice > 0 && tokenPrices.USDC && !payAmount && !exnAmount) {
      const minExn = MIN_PURCHASE_USD / tokenPrice;
      const minPay = MIN_PURCHASE_USD / tokenPrices.USDC;
      setExnAmount(minExn.toFixed(2));
      setPayAmount(minPay.toFixed(2));
    }
  }, [tokenPrices, tokenPrice, payAmount, exnAmount]);


  const fetchBalances = useCallback(async () => {
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
  }, [isConnected, publicKey, connection]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);
  
  const handlePayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    setPayAmount(amount);
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0 && tokenPrices[currency]) {
        const usdValue = numericAmount * (tokenPrices[currency] || 0);
        const receivedExn = usdValue / tokenPrice;
        setExnAmount(receivedExn.toFixed(2));
    } else {
        setExnAmount("");
    }
  };

  const handleExnAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const amount = e.target.value;
      setExnAmount(amount);
      const numericAmount = parseFloat(amount);
      if (!isNaN(numericAmount) && numericAmount > 0 && tokenPrices[currency]) {
          const usdValue = numericAmount * tokenPrice;
          const neededPay = usdValue / (tokenPrices[currency] || 1);
          setPayAmount(neededPay.toFixed(currency === 'SOL' ? 5 : 2));
      } else {
          setPayAmount("");
      }
  };

  const handleSetMax = () => {
    const remainingContributionLimitUSD = MAX_PURCHASE_USD_TOTAL - totalUSDPurchased;
    if (remainingContributionLimitUSD <= 0) return;

    const currentPriceOfSelectedCurrency = tokenPrices[currency] || 0;
    if (currentPriceOfSelectedCurrency === 0) return;

    // Calculate max amount user can spend from their balance
    const maxSpendFromBalance = currency === 'SOL'
        ? Math.max(0, balances.SOL - SOL_GAS_BUFFER)
        : balances.USDC;
    
    const maxSpendFromBalanceUSD = maxSpendFromBalance * currentPriceOfSelectedCurrency;

    // User can spend the lesser of their balance or the remaining purchase limit
    const actualMaxSpendUSD = Math.min(maxSpendFromBalanceUSD, remainingContributionLimitUSD);

    const maxPayAmount = actualMaxSpendUSD / currentPriceOfSelectedCurrency;
    const maxExnAmount = actualMaxSpendUSD / tokenPrice;

    setPayAmount(maxPayAmount.toFixed(currency === 'SOL' ? 5 : 2));
    setExnAmount(maxExnAmount.toFixed(2));
  };


  const usdValue = parseFloat(payAmount) * (tokenPrices[currency] || 0);

  useEffect(() => {
    const numericPayAmount = parseFloat(payAmount);
    // Reset errors if input is empty or invalid
    if (isNaN(numericPayAmount) || numericPayAmount <= 0) {
      setBalanceError("");
      setPurchaseLimitError("");
      return;
    }

    // Check balance
    const maxBalance = currency === 'SOL' ? balances.SOL - SOL_GAS_BUFFER : balances.USDC;
    if (numericPayAmount > maxBalance) {
      setBalanceError(`Insufficient ${currency} balance.`);
    } else if (currency !== 'SOL' && balances.SOL < SOL_GAS_BUFFER) {
      setBalanceError("Insufficient SOL for gas fee.");
    } else {
      setBalanceError("");
    }

    // Check purchase limits
    if (usdValue < MIN_PURCHASE_USD) {
      setPurchaseLimitError(`Minimum purchase is $${MIN_PURCHASE_USD}.`);
    } else if (totalUSDPurchased + usdValue > MAX_PURCHASE_USD_TOTAL) {
       setPurchaseLimitError(`This purchase exceeds the wallet maximum of ${MAX_PURCHASE_USD_TOTAL.toLocaleString()} USDC.`);
    } else {
      setPurchaseLimitError("");
    }

  }, [payAmount, currency, balances, usdValue, totalUSDPurchased]);

  const handleBuyNow = () => {
    const numericExnAmount = parseFloat(exnAmount);
    const numericPayAmount = parseFloat(payAmount);
    if (isConnected && numericExnAmount > 0 && numericPayAmount > 0) {
      handlePurchase(numericExnAmount, numericPayAmount, currency);
    }
  };
  
  const remainingPurchaseable = MAX_PURCHASE_USD_TOTAL - totalUSDPurchased;

  const isPurchaseDisabled = !isConnected || isLoadingPrices || !!balanceError || !!purchaseLimitError || !isPresaleActive || isLoadingPurchase || isHardCapReached || parseFloat(payAmount) <= 0;

  const getButtonText = () => {
    if (isHardCapReached) return "Hard Cap Reached";
    if (!isPresaleActive) return "Presale is currently closed";
    if (isLoadingPrices) return 'Loading Prices...';
    if (!isConnected) return "Connect Wallet to Buy";
    if (balanceError) return balanceError;
    if (purchaseLimitError) return purchaseLimitError;
    if (isLoadingPurchase) return "Processing...";
    return "Buy EXN Now";
  }

  const currentBalance = balances[currency];

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
            Secure your EXN tokens at the special presale price of ${tokenPrice.toPrecision(2)} before the public listing at <span className="text-green-400 font-semibold">${LISTING_PRICE_PER_EXN}</span>.
        </CardDescription>
      </div>
      
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
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      Balance: {isFetchingBalance 
                        ? <Skeleton className="h-4 w-16 inline-block" /> 
                        : `${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${currency}`
                      }
                    </span>
                    <Button variant="ghost" size="sm" className="h-auto p-0.5 text-primary" onClick={handleSetMax}>Max</Button>
                  </div>
                )}
            </div>
            <div className="flex items-center gap-2">
               <Input 
                  type="number"
                  value={payAmount}
                  onChange={handlePayAmountChange}
                  className="text-2xl font-bold flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                  placeholder="0.00"
               />
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
             {payAmount && !isNaN(usdValue) && usdValue > 0 && <div className="text-sm font-normal text-muted-foreground">~ ${usdValue.toFixed(2)} USD</div>}
          </div>
          {(balanceError || purchaseLimitError) && <p className="text-xs text-red-400 mt-1 pl-1">{balanceError || purchaseLimitError}</p>}

        <div className="flex justify-center my-2">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>

        <div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="text-white font-medium">EXN</span>
            </div>
            <Input 
                type="number"
                value={exnAmount}
                onChange={handleExnAmountChange}
                className="text-2xl font-bold flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                placeholder="0"
            />
          </div>
        </div>
      </div>
      
       <div className="text-center text-xs text-muted-foreground pt-2">
            You have contributed ${totalUSDPurchased.toLocaleString(undefined, {maximumFractionDigits: 2})} of ${MAX_PURCHASE_USD_TOTAL.toLocaleString()} USDC total.
            <br/>
            You can still purchase up to ${remainingPurchaseable.toLocaleString(undefined, {maximumFractionDigits: 2})} USDC worth of tokens.
       </div>


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

    