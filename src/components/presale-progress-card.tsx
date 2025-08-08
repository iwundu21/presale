
"use client";

import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

// Presale configuration
const TOTAL_PRESALE_SUPPLY = 50_000_000; // 50 Million EXN
const PRESALE_END_DATE = new Date("2024-09-30T23:59:59Z");
const BASE_SOLD_AMOUNT = 12_500_000; // Start with 12.5 Million EXN
const EXN_PRICE = 0.09;

const formatNumber = (num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      ...options
    }).format(num);
};

type PresaleProgressCardProps = {
    userPurchasedAmount: number;
}

export function PresaleProgressCard({ userPurchasedAmount }: PresaleProgressCardProps) {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [totalSoldValue, setTotalSoldValue] = useState(0);

    const totalSold = BASE_SOLD_AMOUNT + userPurchasedAmount;

    // Effect for updating progress bar and countdown
    useEffect(() => {
        const percentage = (totalSold / TOTAL_PRESALE_SUPPLY) * 100;
        const soldValue = totalSold * EXN_PRICE;
        setTotalSoldValue(soldValue);
        
        // Clamp progress to a max of 100
        setProgress(Math.min(percentage, 100));

        // Countdown timer logic
        const countdownTimer = setInterval(() => {
            const now = new Date();
            const difference = PRESALE_END_DATE.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                 setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                 clearInterval(countdownTimer);
            }
        }, 1000);

        return () => {
            clearInterval(countdownTimer);
        };
    }, [totalSold]);

    return (
        <Card className="w-full shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-md">
                        <Flame className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Presale Progress</CardTitle>
                </div>
                <CardDescription>
                    The presale is live! Join the revolution.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={progress} className="w-full h-3" />
                <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-muted-foreground">Sold: <span className="text-white font-bold">{formatNumber(totalSold)} EXN</span></span>
                    <span className="text-muted-foreground">Target: <span className="text-white font-bold">{formatNumber(TOTAL_PRESALE_SUPPLY)} EXN</span></span>
                </div>
                 <div className="text-center">
                    <p className="text-lg font-semibold text-white">
                        ${formatNumber(totalSoldValue, { notation: 'standard', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Raised</p>
                 </div>
                 <div className="text-center bg-muted/50 rounded-lg p-2">
                    <p className="text-sm text-muted-foreground mb-1">Presale Ends In</p>
                    <div className="grid grid-cols-4 gap-1 text-center">
                        <div>
                            <p className="text-2xl font-bold text-primary">{String(timeLeft.days).padStart(2, '0')}</p>
                            <p className="text-xs text-muted-foreground">Days</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">{String(timeLeft.hours).padStart(2, '0')}</p>
                            <p className="text-xs text-muted-foreground">Hours</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">{String(timeLeft.minutes).padStart(2, '0')}</p>
                            <p className="text-xs text-muted-foreground">Minutes</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">{String(timeLeft.seconds).padStart(2, '0')}</p>
                            <p className="text-xs text-muted-foreground">Seconds</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
