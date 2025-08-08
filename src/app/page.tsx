
"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@solana/wallet-adapter-react";
import { LandingPage } from "@/components/landing-page";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  useEffect(() => {
    if (connected) {
      router.push('/dashboard');
    }
  }, [connected, router]);

  const handleConnect = () => {
    setVisible(true);
  };

  return (
    <LandingPage onConnect={handleConnect} isConnecting={connecting} />
  );
}
