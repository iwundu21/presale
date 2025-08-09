
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@solana/wallet-adapter-react";
import { LandingPage } from "@/components/landing-page";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getPresaleEndDate } from "@/services/presale-date-service";

export default function Home() {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [presaleEndDate, setPresaleEndDate] = useState(new Date());

  useEffect(() => {
    document.title = "Exnus Presale";
    setPresaleEndDate(getPresaleEndDate());
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
    />
  );
}
