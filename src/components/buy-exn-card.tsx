
"use client";

import { useState, useEffect } from "react";
import { ArrowDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BuyExnCardProps = {
  isConnected: boolean;
  onPurchase: (exnAmount: number, paidAmount: number, currency: string) => void;
};

const EXN_PRICE = 0.09;

export function BuyExnCard({ isConnected, onPurchase }: BuyExnCardProps) {
  const [payAmount, setPayAmount] = useState("100.00");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [currency, setCurrency] = useState("USDC");

  useEffect(() => {
    const numericPayAmount = parseFloat(payAmount);
    if (!isNaN(numericPayAmount) && numericPayAmount > 0) {
      const calculatedReceive = numericPayAmount / EXN_PRICE;
      setReceiveAmount(calculatedReceive.toFixed(2));
    } else {
      setReceiveAmount("");
    }
  }, [payAmount, currency]);

  const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string to clear the input
    if (value === "") {
        setPayAmount("");
        setReceiveAmount("");
        return;
    }
     // Allow only numbers and a single dot
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
        setPayAmount(value);
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue) && numericValue > 0) {
            setReceiveAmount((numericValue / EXN_PRICE).toFixed(2));
        } else {
            setReceiveAmount("");
        }
    }
  };

  const handleReceiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
        setReceiveAmount("");
        setPayAmount("");
        return;
    }
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
        setReceiveAmount(value);
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue) && numericValue > 0) {
            setPayAmount((numericValue * EXN_PRICE).toFixed(2));
        } else {
            setPayAmount("");
        }
    }
  };
  
  const handleBuyNow = () => {
    const numericReceiveAmount = parseFloat(receiveAmount);
    const numericPayAmount = parseFloat(payAmount);
    if (numericReceiveAmount > 0 && isConnected) {
      onPurchase(numericReceiveAmount, numericPayAmount, currency);
    }
  };

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
      <CardContent>
        <div className="relative">
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Pay</span>
              <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-auto h-auto bg-transparent border-none text-white font-medium">
                    <SelectValue placeholder="Coin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="SOL">SOL</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <Input 
                id="pay" 
                type="text" 
                value={payAmount} 
                onChange={handlePayChange} 
                placeholder="0.00" 
                className="text-2xl font-bold bg-transparent border-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-1 bg-card border rounded-full">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="text-white font-medium">EXN</span>
            </div>
            <Input 
                id="receive" 
                type="text" 
                value={receiveAmount} 
                onChange={handleReceiveChange} 
                placeholder="0.00" 
                className="text-2xl font-bold bg-transparent border-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
            size="lg" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6" 
            disabled={!isConnected || !parseFloat(payAmount) || parseFloat(payAmount) <= 0}
            onClick={handleBuyNow}
        >
          {isConnected ? "Buy EXN" : "Connect Wallet to Buy"}
        </Button>
      </CardFooter>
    </Card>
  );
}
