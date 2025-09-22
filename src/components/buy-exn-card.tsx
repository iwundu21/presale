
"use client";

import { useState, useEffect } from "react";
import { ArrowDown, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { USDC_MINT } from "@/config";
import { useDashboard } from "./dashboard-client-provider";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

const SOL_GAS_BUFFER = 0.0009; // Reserve 0.0009 SOL for gas fees
const MIN_PURCHASE_USD = 1;
const MAX_PURCHASE_USD = 5000;

type Currency = "USDC" | "SOL";

export function BuyExnCard() {
  const { connected: isConnected, handlePurchase, tokenPrices, isLoadingPrices, presaleInfo, isPresaleActive, isLoadingPurchase, isHardCapReached, exnBalance } = useDashboard();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [payAmount, setPayAmount] = useState("1.00");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [balances, setBalances] = useState({ SOL: 0, USDC: 0 });
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [limitError, setLimitError] = useState("");

  const exnPrice = presaleInfo?.tokenPrice || 0.09;
  const userTotalInvestedUSD = exnBalance * exnPrice;
  const hasReachedMax = userTotalInvestedUSD >= MAX_PURCHASE_USD;
  
  useEffect(() => {
    const fetchBalances = async () => {
        if (!isConnected || !publicKey) return;
        setIsFetchingBalance(true);
        try {
            // Fetch SOL balance
            const solBalance = await connection.getBalance(publicKey);

            // Fetch USDC balance
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

  const getUsdValue = (amount: string, curr: Currency): number | null => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return null;
    
    const price = tokenPrices[curr];
    if (price === null) return null;

    return numericAmount * price;
  }

  const calculateReceiveAmount = (pay: string, curr: Currency) => {
      const usdValue = getUsdValue(pay, curr);
      if (usdValue === null || exnPrice === 0) return "";

      const calculatedReceive = usdValue / exnPrice;
      
      if (calculatedReceive > 0 && calculatedReceive < 0.01) {
          return calculatedReceive.toFixed(6);
      }
      return calculatedReceive.toFixed(2);
  };

  const calculatePayAmount = (receive: string, curr: Currency) => {
    const numericReceiveAmount = parseFloat(receive);
    if (isNaN(numericReceiveAmount) || numericReceiveAmount <= 0) {
      return "";
    }
    
    const usdValue = numericReceiveAmount * exnPrice;
    const price = tokenPrices[curr];
    if (price === null || price === 0) return "";
    
    if (curr === 'SOL') {
      return (usdValue / price).toFixed(5);
    }
    
    return (usdValue / price).toFixed(2);
  };

  useEffect(() => {
    const newReceiveAmount = calculateReceiveAmount(payAmount, currency);
    setReceiveAmount(newReceiveAmount);
  }, [payAmount, currency, tokenPrices, exnPrice]);


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
    const rawUsdValue = getUsdValue(payAmount, currency);
    if (rawUsdValue === null) {
        setLimitError("");
        return;
    }
    
    // Round to 2 decimal places to avoid floating point inaccuracies
    const usdValue = parseFloat(rawUsdValue.toFixed(2));
    const totalFutureInvestment = userTotalInvestedUSD + usdValue;

    if (usdValue < MIN_PURCHASE_USD) {
        setLimitError(`Minimum purchase is $${MIN_PURCHASE_USD}.`);
    } else if (totalFutureInvestment > MAX_PURCHASE_USD) {
        setLimitError(`Purchase exceeds wallet limit of $${MAX_PURCHASE_USD}.`);
    } else {
        setLimitError("");
    }
  }, [payAmount, currency, tokenPrices, userTotalInvestedUSD]);


  const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setPayAmount(value);
    }
  };

  const handleReceiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
     if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setReceiveAmount(value);
        const newPayAmount = calculatePayAmount(value, currency) || "";
        setPayAmount(newPayAmount);
    }
  };
  
  const handleBuyNow = () => {
    const numericReceiveAmount = parseFloat(receiveAmount);
    const numericPayAmount = parseFloat(payAmount);
    if (numericReceiveAmount > 0 && isConnected) {
      handlePurchase(numericReceiveAmount, numericPayAmount, currency);
    }
  };

  const currentBalance = balances[currency as keyof typeof balances];
  const maxSpend = currency === 'SOL' ? currentBalance - SOL_GAS_BUFFER : currentBalance;
  const isPurchaseDisabled = !isConnected || !parseFloat(payAmount) || parseFloat(payAmount) <= 0 || isLoadingPrices || !!balanceError || !!limitError || !isPresaleActive || isLoadingPurchase || isHardCapReached || hasReachedMax;

  const getButtonText = () => {
    if (hasReachedMax) return "Maximum contribution reached";
    if (isHardCapReached) return "Hard Cap Reached";
    if (!isPresaleActive) return "Presale is currently closed";
    if (isLoadingPrices) return 'Loading Prices...';
    if (!isConnected) return "Connect Wallet to Buy";
    if (limitError) return limitError;
    if (balanceError) return balanceError;
    if (isLoadingPurchase) return "Processing...";
    return "Buy EXN";
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
          Current Price: <strong>${exnPrice}</strong> per EXN
        </CardDescription>
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
        <div>
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
                                    All transactions on the Solana network, including token purchases, require a small network fee paid in SOL.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {isConnected && (
                  <button onClick={() => setPayAmount(maxSpend > 0 ? maxSpend.toFixed(currency === 'SOL' ? 5 : 2) : "0")} className="text-muted-foreground hover:text-white transition-colors">
                    Balance: {isFetchingBalance 
                      ? <Skeleton className="h-4 w-16 inline-block" /> 
                      : `${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${currency}`
                    }
                  </button>
                )}
            </div>
            <div className="flex items-center gap-2">
              <Input 
                  id="pay" 
                  type="text" 
                  value={payAmount} 
                  onChange={handlePayChange} 
                  placeholder="0.00" 
                  className="text-2xl font-bold bg-transparent border-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow"
                  disabled={isLoadingPrices || !isPresaleActive || isLoadingPurchase}
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
          </div>
          {limitError ? (
            <p className="text-xs text-red-400 mt-1 pl-1">{limitError}</p>
          ) : balanceError ? (
            <p className="text-xs text-red-400 mt-1 pl-1">{balanceError}</p>
          ): null}
        </div>

        <div className="flex justify-center my-2">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>

        <div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="text-white font-medium">EXN</span>
            </div>
            {isLoadingPrices ? (
                <Skeleton className="h-8 w-1/2" />
            ) : (
                <Input 
                    id="receive" 
                    type="text" 
                    value={receiveAmount} 
                    onChange={handleReceiveChange} 
                    placeholder="0.00" 
                    className="text-2xl font-bold bg-transparent border-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isLoadingPrices || !isPresaleActive || isLoadingPurchase}
                />
            )}
          </div>
        </div>

        {currentPrice && !isLoadingPrices && (
            <p className="text-xs text-muted-foreground text-center mt-2">
                Current {currency} Price: ~${currentPrice.toFixed(2)}
            </p>
        )}
        
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

    