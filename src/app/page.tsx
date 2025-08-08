
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { LandingPage } from "@/components/landing-page";

export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleConnect = () => {
    setIsConnecting(true);
    toast({
      title: "Connecting Wallet...",
      description: "Please approve the connection in your wallet.",
    });

    // Simulate wallet connection
    setTimeout(() => {
      localStorage.setItem('walletConnected', 'true');
      toast({
        title: "Wallet Connected",
        description: "You have successfully connected your wallet.",
      });
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <LandingPage onConnect={handleConnect} isConnecting={isConnecting} />
  );
}
