
"use client";

import { useState, useEffect } from "react";
import { ArrowDown, Copy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { USDC_MINT, USDT_MINT, EXN_PRICE, PRESALE_WALLET_ADDRESS } from "@/config";
import { useDashboard } from "./dashboard-client-provider";
import { useToast } from "@/hooks/use-toast";

const SOL_GAS_BUFFER = 0.005; // Reserve 0.005 SOL for gas fees

export function BuyExnCard() {
  const { connected: isConnected, handlePurchase, solPrice, isLoadingPrice } = useDashboard();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const [payAmount, setPayAmount] = useState("100.00");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [currency, setCurrency] = useState("USDC");
  const [balances, setBalances] = useState({ SOL: 0, USDC: 0, USDT: 0 });
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  
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
           
            // Fetch USDT balance
            let usdtBalance = 0;
            try {
                const usdtTokenAccount = await getAssociatedTokenAddress(USDT_MINT, publicKey);
                const usdtTokenAccountInfo = await connection.getParsedAccountInfo(usdtTokenAccount);
                if (usdtTokenAccountInfo.value) {
                    usdtBalance = (usdtTokenAccountInfo.value.data as any).parsed.info.tokenAmount.uiAmount;
                }
            } catch (e) {
                 console.log("Could not fetch USDT balance for user, likely no account exists yet.");
            }

            setBalances({
                SOL: solBalance / LAMPORTS_PER_SOL,
                USDC: usdcBalance,
                USDT: usdtBalance
            });
        } catch (error) {
            console.error("Failed to fetch wallet balances", error);
        }
        setIsFetchingBalance(false);
    };

    fetchBalances();
  }, [isConnected, publicKey, connection]);

  const calculateReceiveAmount = (pay: string, curr: string, priceOfSol: number | null) => {
      const numericPayAmount = parseFloat(pay);
      if (isNaN(numericPayAmount) || numericPayAmount <= 0) {
        return "";
      }

      let usdValue = numericPayAmount;
      if (curr === 'SOL') {
        if (!priceOfSol) return ""; // Wait for price
        usdValue = numericPayAmount * priceOfSol;
      }

      const calculatedReceive = usdValue / EXN_PRICE;
      return calculatedReceive.toFixed(2);
  };

  const calculatePayAmount = (receive: string, curr: string, priceOfSol: number | null) => {
    const numericReceiveAmount = parseFloat(receive);
    if (isNaN(numericReceiveAmount) || numericReceiveAmount <= 0) {
      return "";
    }
    
    const usdValue = numericReceiveAmount * EXN_PRICE;
    
    if (curr === 'SOL') {
      if (!priceOfSol) return "";
      return (usdValue / priceOfSol).toFixed(5);
    }
    
    return usdValue.toFixed(2);
  };

  useEffect(() => {
    setReceiveAmount(calculateReceiveAmount(payAmount, currency, solPrice));
  }, [payAmount, currency, solPrice]);

  useEffect(() => {
    const numericPayAmount = parseFloat(payAmount);
    if (isNaN(numericPayAmount)) {
      setBalanceError("");
      return;
    }
    
    const maxBalance = currency === 'SOL' ? balances.SOL - SOL_GAS_BUFFER : balances[currency as keyof typeof balances];

    if (numericPayAmount > maxBalance) {
      setBalanceError("Insufficient balance.");
    } else {
      setBalanceError("");
    }
  }, [payAmount, currency, balances]);


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
        setPayAmount(calculatePayAmount(value, currency, solPrice) || "");
    }
  };
  
  const handleBuyNow = () => {
    const numericReceiveAmount = parseFloat(receiveAmount);
    const numericPayAmount = parseFloat(payAmount);
    if (numericReceiveAmount > 0 && isConnected) {
      handlePurchase(numericReceiveAmount, numericPayAmount, currency);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (PRESALE_WALLET_ADDRESS) {
      navigator.clipboard.writeText(PRESALE_WALLET_ADDRESS);
      toast({
        title: "Address Copied",
        description: "The presale wallet address has been copied to your clipboard.",
        variant: 'success',
      });
    }
  };

  const currentBalance = balances[currency as keyof typeof balances];
  const maxSpend = currency === 'SOL' ? currentBalance - SOL_GAS_BUFFER : currentBalance;
  const isPurchaseDisabled = !isConnected || !parseFloat(payAmount) || parseFloat(payAmount) <= 0 || (currency === 'SOL' && isLoadingPrice) || !!balanceError;

  return (
    <Card className="w-full shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/20 rounded-md">
                <Zap className="h-6 w-6 text-primary"/>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Buy EXN Tokens</CardTitle>
        </div>
        <CardDescription>
          Current Price: <strong>${EXN_PRICE}</strong> per EXN
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">You Pay</span>
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
                  disabled={currency === 'SOL' && isLoadingPrice}
              />
               <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[120px] h-auto bg-secondary border-secondary text-white font-medium focus:ring-0">
                    <SelectValue placeholder="Coin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="SOL">SOL</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          {balanceError && <p className="text-xs text-red-400 mt-1 pl-1">{balanceError} {currency === 'SOL' && `(Requires ~${SOL_GAS_BUFFER} SOL for fees)`}</p>}
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
            {isLoadingPrice && currency === 'SOL' ? (
                <Skeleton className="h-8 w-1/2" />
            ) : (
                <Input 
                    id="receive" 
                    type="text" 
                    value={receiveAmount} 
                    onChange={handleReceiveChange} 
                    placeholder="0.00" 
                    className="text-2xl font-bold bg-transparent border-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={currency === 'SOL' && isLoadingPrice}
                />
            )}
          </div>
        </div>

        {currency === 'SOL' && solPrice && (
            <p className="text-xs text-muted-foreground text-center mt-2">
                Current SOL Price: ~${solPrice.toFixed(2)}
            </p>
        )}
        
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>You are sending funds to the official presale address:</p>
          <div className="flex items-center justify-center gap-2 mt-1 font-mono bg-muted/50 p-2 rounded-md">
              <span className="truncate">{PRESALE_WALLET_ADDRESS}</span>
              <Button onClick={handleCopyToClipboard} variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <Copy className="h-4 w-4" />
              </Button>
          </div>
        </div>

      </CardContent>
      <CardFooter>
        <Button 
            size="lg" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6" 
            disabled={isPurchaseDisabled}
            onClick={handleBuyNow}
        >
          {isLoadingPrice && currency === 'SOL' ? 'Loading Price...' : (isConnected ? (balanceError || "Buy EXN") : "Connect Wallet to Buy")}
        </Button>
      </CardFooter>
    </Card>
  );
}
