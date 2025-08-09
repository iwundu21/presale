
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@solana/wallet-adapter-react";
import { LandingPage } from "@/components/landing-page";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getClientPresaleEndDate } from "@/services/presale-date-service";

export default function Home() {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [presaleEndDate, setPresaleEndDate] = useState<Date | null>(null);
  const [isLoadingDate, setIsLoadingDate] = useState(true);

  useEffect(() => {
    document.title = "Exnus Presale";
    setIsLoadingDate(true);
    const date = getClientPresaleEndDate();
    setPresaleEndDate(date);
    setIsLoadingDate(false);
  }, []);

  useEffect(() => {
    if (connected) {
      router.push('/dashboard');
    }
  }, [connected, router]);

  const handleConnect = () => {
    setVisible(true);
  };
  
  // Ensure we have a valid date before rendering LandingPage
  if (isLoadingDate || !presaleEndDate) {
    return (
      <div className="flex justify-center items-center min-h-screen">
          <p>Loading Presale Information...</p>
      </div>
    );
  }

  return (
    <LandingPage 
      onConnect={handleConnect} 
      isConnecting={connecting} 
      presaleEndDate={presaleEndDate}
      isLoadingDate={isLoadingDate}
    />
  );
}
