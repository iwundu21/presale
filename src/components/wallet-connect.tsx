
"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${walletAddress}`} alt="Wallet Avatar" />
              <AvatarFallback>
                {walletAddress.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{`${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
            <span className="sm:hidden">Wallet</span>
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

  return (
     <WalletMultiButton style={{ 
       backgroundColor: 'hsl(var(--primary))', 
       color: 'hsl(var(--primary-foreground))',
       borderRadius: 'var(--radius)'
    }} />
  );
}
