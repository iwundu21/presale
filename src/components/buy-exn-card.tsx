"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Zap } from "lucide-react";
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
  }, [payAmount]);

  const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPayAmount(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      setReceiveAmount((numericValue / EXN_PRICE).toFixed(2));
    } else {
      setReceiveAmount("");
    }
  };

  const handleReceiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReceiveAmount(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      setPayAmount((numericValue * EXN_PRICE).toFixed(2));
    } else {
      setPayAmount("");
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
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-md">
                <Zap className="h-6 w-6 text-primary"/>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Buy EXN Tokens</CardTitle>
        </div>
        <CardDescription>
          Purchase EXN instantly using your connected wallet. Price: ${EXN_PRICE}/EXN
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="pay" className="text-sm font-medium text-muted-foreground">You pay</label>
          <div className="flex gap-2">
            <Input id="pay" type="number" value={payAmount} onChange={handlePayChange} placeholder="0.00" className="text-lg"/>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[120px]">
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
        <div className="space-y-1">
          <label htmlFor="receive" className="text-sm font-medium text-muted-foreground">You receive</label>
          <div className="flex gap-2">
            <Input id="receive" type="number" value={receiveAmount} onChange={handleReceiveChange} placeholder="0.00" className="text-lg"/>
            <div className="w-[120px] flex items-center justify-center rounded-md bg-muted px-3 text-sm font-medium">
              EXN
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
            size="lg" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg" 
            disabled={!isConnected || !parseFloat(payAmount) || parseFloat(payAmount) <= 0}
            onClick={handleBuyNow}
        >
          {isConnected ? "Buy Now" : "Connect Wallet to Buy"}
          <ArrowRight className="ml-2 h-5 w-5"/>
        </Button>
      </CardFooter>
    </Card>
  );
}
