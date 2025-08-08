
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ExnusLogo } from "@/components/icons";
import { WalletConnect } from "./wallet-connect";


export function AppHeader() {
    const { connected } = useWallet();

    return (
        <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <ExnusLogo className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold text-white">Exnus</h1>
                </div>
                <div className="wallet-adapter-dropdown">
                    <WalletConnect />
                </div>
            </div>
        </header>
    );
}
