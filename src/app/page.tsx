
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@solana/wallet-adapter-react";
import { LandingPage } from "@/components/landing-page";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getPresaleInfo, PresaleInfo } from "@/services/presale-info-service";
import { Skeleton } from "@/components/ui/skeleton";
import { getPresaleEndDate } from "@/services/presale-date-service";

export default function Home() {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [presaleEndDate, setPresaleEndDate] = useState<Date | null>(null);
  const [presaleInfo, setPresaleInfo] = useState<PresaleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Exnus Presale";
    setIsLoading(true);
    
    const fetchInitialData = async () => {
        try {
            const [date, info] = await Promise.all([
              getPresaleEndDate(),
              getPresaleInfo()
            ]);
            setPresaleEndDate(date);
            setPresaleInfo(info);
        } catch (error) {
            console.error("Failed to load presale data", error);
            // Set defaults on error
             if (!presaleEndDate) {
                const defaultEndDate = new Date();
                defaultEndDate.setDate(defaultEndDate.getDate() + 30);
                setPresaleEndDate(defaultEndDate);
            }
            if (!presaleInfo) {
                setPresaleInfo({ seasonName: "Early Stage", tokenPrice: 0.09 });
            }
        } finally {
             setIsLoading(false);
        }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (connected) {
      router.push('/dashboard');
    }
  }, [connected, router]);

  const handleConnect = () => {
    setVisible(true);
  };
  
  if (isLoading || !presaleEndDate || !presaleInfo) {
    return (
      <div className="flex-grow container mx-auto text-center py-20 lg:py-32 space-y-8">
          <Skeleton className="h-16 w-3/4 mx-auto" />
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <div className="text-center bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
             <Skeleton className="h-5 w-32 mx-auto mb-2" />
             <div className="grid grid-cols-4 gap-2">
                <div><Skeleton className="h-10 w-full" /><Skeleton className="h-3 w-1/2 mx-auto mt-1" /></div>
                <div><Skeleton className="h-10 w-full" /><Skeleton className="h-3 w-1/2 mx-auto mt-1" /></div>
                <div><Skeleton className="h-10 w-full" /><Skeleton className="h-3 w-1/2 mx-auto mt-1" /></div>
                <div><Skeleton className="h-10 w-full" /><Skeleton className="h-3 w-1/2 mx-auto mt-1" /></div>
             </div>
           </div>
          <Skeleton className="h-12 w-48 mx-auto" />
      </div>
    );
  }

  return (
    <LandingPage 
      onConnect={handleConnect} 
      isConnecting={connecting} 
      presaleEndDate={presaleEndDate}
      presaleInfo={presaleInfo}
    />
  );
}
