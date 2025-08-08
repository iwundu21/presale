
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ExnusLogo } from "@/components/icons";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from "react";

export function AppHeader() {
    const { connected } = useWallet();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const isDashboard = pathname === '/dashboard';

    return (
        <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <ExnusLogo className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold text-white">Exnus</h1>
                </div>
                <div className="wallet-adapter-dropdown">
                    {isClient && (
                        <WalletMultiButton style={{
                            backgroundColor: isDashboard && connected ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
                            color: isDashboard && connected ? 'hsl(var(--secondary-foreground))' : 'hsl(var(--primary-foreground))',
                            borderRadius: 'var(--radius)',
                            border: isDashboard && connected ? '1px solid hsl(var(--border))' : 'none'
                        }} />
                    )}
                </div>
            </div>
        </header>
    );
}
