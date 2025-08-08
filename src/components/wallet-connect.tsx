
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type WalletConnectProps = {
  isConnected: boolean;
  walletAddress: string;
  onDisconnect: () => void;
};

export function WalletConnect({
  isConnected,
  walletAddress,
  onDisconnect,
}: WalletConnectProps) {
  const { wallet } = useWallet();

  if (wallet && isConnected) {
    return <WalletMultiButton style={{
      backgroundColor: 'hsl(var(--secondary))',
      color: 'hsl(var(--secondary-foreground))',
      borderRadius: 'var(--radius)',
      border: '1px solid hsl(var(--border))'
    }} />;
  }

  return (
     <WalletMultiButton style={{ 
      backgroundColor: 'hsl(var(--primary))', 
      color: 'hsl(var(--primary-foreground))',
      borderRadius: 'var(--radius)'
    }}>
      Connect Wallet
    </WalletMultiButton>
  );
}
