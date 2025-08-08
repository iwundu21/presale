
"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
      setIsClient(true);
  }, []);


  if (isConnected) {
    const formattedAddress = `${walletAddress.substring(0, 5)}...${walletAddress.substring(walletAddress.length - 5)}`;
    const formattedAddressMobile = `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <span className="hidden sm:inline">{formattedAddress}</span>
            <span className="sm:hidden">{formattedAddressMobile}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDisconnect}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!isClient) {
    return null;
  }

  return (
     <WalletMultiButton style={{ 
       backgroundColor: 'hsl(var(--primary))', 
       color: 'hsl(var(--primary-foreground))',
       borderRadius: 'var(--radius)'
    }} />
  );
}
