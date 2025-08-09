
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@solana/wallet-adapter-react";
import { LandingPage } from "@/components/landing-page";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getClientPresaleEndDate, setClientPresaleEndDate } from "@/services/presale-date-service";
import { getPresaleEndDate as getServerPresaleEndDate } from "@/services/firestore-service";

export default function Home() {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [presaleEndDate, setPresaleEndDate] = useState(getClientPresaleEndDate());
  const [isLoadingDate, setIsLoadingDate] = useState(true);

  useEffect(() => {
    document.title = "Exnus Presale";
    const fetchEndDate = async () => {
      setIsLoadingDate(true);
      try {
        const serverDate = await getServerPresaleEndDate();
        setPresaleEndDate(serverDate);
        setClientPresaleEndDate(serverDate);
      } catch (error) {
        console.error("Could not fetch end date from server, using client fallback.");
        setPresaleEndDate(getClientPresaleEndDate());
      } finally {
        setIsLoadingDate(false);
      }
    };
    fetchEndDate();
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
