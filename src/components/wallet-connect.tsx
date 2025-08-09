
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

export function WalletConnect() {
  const { wallet, connected } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const buttonStyles: React.CSSProperties = {
    '--dapp-name': 'Exnus Protocol Presale',
    backgroundColor: connected ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
    color: connected ? 'hsl(var(--secondary-foreground))' : 'hsl(var(--primary-foreground))',
    borderRadius: 'var(--radius)',
    border: connected ? '1px solid hsl(var(--border))' : 'none'
  };
  
  if (!isClient) {
    return null;
  }

  if (wallet && connected) {
    return <WalletMultiButton style={buttonStyles} />;
  }

  return (
     <WalletMultiButton style={buttonStyles}>
      Connect Wallet
    </WalletMultiButton>
  );
}
