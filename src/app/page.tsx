
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@solana/wallet-adapter-react";
import { LandingPage } from "@/components/landing-page";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getClientPresaleEndDate, setClientPresaleEndDate } from "@/services/presale-date-service";

export default function Home() {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [presaleEndDate, setPresaleEndDate] = useState(new Date());
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

  return (
    <LandingPage 
      onConnect={handleConnect} 
      isConnecting={connecting} 
      presaleEndDate={presaleEndDate}
      isLoadingDate={isLoadingDate}
    />
  );
}
