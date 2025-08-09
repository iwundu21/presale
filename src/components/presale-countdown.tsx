
"use client";

import { useState, useEffect } from "react";

type PresaleCountdownProps = {
    presaleEndDate: Date;
    seasonName: string;
}

export function PresaleCountdown({ presaleEndDate, seasonName }: PresaleCountdownProps) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const countdownTimer = setInterval(() => {
            const now = new Date();
            const difference = new Date(presaleEndDate).getTime() - now.getTime();

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
    }, [presaleEndDate]);
    
    return (
        <div className="text-center bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-2">{seasonName} season ends in</p>
            <div className="grid grid-cols-4 gap-2 text-center max-w-sm mx-auto">
                <div>
                    <p className="text-3xl lg:text-4xl font-bold text-primary">{String(timeLeft.days).padStart(2, '0')}</p>
                    <p className="text-xs text-muted-foreground">Days</p>
                </div>
                <div>
                    <p className="text-3xl lg:text-4xl font-bold text-primary">{String(timeLeft.hours).padStart(2, '0')}</p>
                    <p className="text-xs text-muted-foreground">Hours</p>
                </div>
                <div>
                    <p className="text-3xl lg:text-4xl font-bold text-primary">{String(timeLeft.minutes).padStart(2, '0')}</p>
                    <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
                <div>
                    <p className="text-3xl lg:text-4xl font-bold text-primary">{String(timeLeft.seconds).padStart(2, '0')}</p>
                    <p className="text-xs text-muted-foreground">Seconds</p>
                </div>
            </div>
        </div>
    )
}
