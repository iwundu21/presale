
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const ADMIN_WALLET = "9Kqt28pfMVBsBvXYYnYQCT2BZyorAwzbR6dUmgQfsZYW";

export function AdminOnly({ children }: { children: React.ReactNode }) {
    const { publicKey, connected, connecting } = useWallet();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wait until wallet connection status is resolved
        if (connecting) {
            return;
        }

        if (connected && publicKey) {
            if (publicKey.toBase58() === ADMIN_WALLET) {
                setIsAuthorized(true);
            } else {
                router.push('/');
            }
        }
        
        // If not connected, we wait for the user to connect via the button
        if (!connected) {
             setIsAuthorized(false);
        }

        setIsLoading(false);

    }, [publicKey, connected, connecting, router]);

    if (isLoading) {
         return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Verifying authorization...</p>
                </div>
            </div>
        );
    }
    
    if (!connected) {
        return (
             <div className="flex items-center justify-center h-screen">
                <div className="text-center p-8 rounded-lg border border-border bg-card/50">
                    <h2 className="text-2xl font-bold mb-2 text-white">Admin Access</h2>
                    <p className="text-muted-foreground mb-6">Please connect the admin wallet to proceed.</p>
                     <WalletMultiButton style={{ 
                        '--dapp-name': 'Exnus Admin',
                         backgroundColor: 'hsl(var(--primary))',
                         color: 'hsl(var(--primary-foreground))',
                      }}/>
                </div>
            </div>
        )
    }

    if (!isAuthorized) {
         return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p>Unauthorized. Redirecting...</p>
                </div>
            </div>
        );
    }


    return <>{children}</>;
}
