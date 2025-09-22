
"use client";

import Image from 'next/image';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function AdminHeader() {
    return (
        <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Exnus Logo" width={32} height={32} className="h-8 w-8" />
                    <h1 className="text-2xl font-bold text-white">Exnus Admin</h1>
                </div>
                 <WalletMultiButton style={{ 
                    '--dapp-name': 'Exnus Admin',
                     backgroundColor: 'hsl(var(--secondary))',
                     color: 'hsl(var(--secondary-foreground))',
                     border: '1px solid hsl(var(--border))'
                  }}/>
            </div>
        </header>
    );
}
