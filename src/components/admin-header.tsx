
"use client";

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { Logo } from './logo';

export function AdminHeader() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    return (
        <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Logo isAdmin />
                </div>
                 {isClient && <WalletMultiButton style={{ 
                    '--dapp-name': 'Exnus Admin',
                     backgroundColor: 'hsl(var(--secondary))',
                     color: 'hsl(var(--secondary-foreground))',
                     border: '1px solid hsl(var(--border))'
                  }}/>}
            </div>
        </header>
    );
}
