
"use client";

import { usePathname } from 'next/navigation';
import { WalletConnect } from "./wallet-connect";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AdminHeader } from './admin-header';


export function AppHeader() {
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    if (pathname.startsWith('/admin')) {
      return <AdminHeader />;
    }

    return (
        <header className="p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2 pl-4">
                    <Image src="/logo.png" alt="Exnus Logo" width={32} height={32} className="h-8 w-8" />
                    <h1 className="text-2xl font-bold text-white">Exnus</h1>
                </div>
                <div className="container mx-auto flex justify-end p-0">
                    {isClient && (
                        <div className="wallet-adapter-dropdown">
                            <WalletConnect />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

