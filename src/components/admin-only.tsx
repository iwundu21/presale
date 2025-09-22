
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
            setIsLoading(true);
            return;
        }

        if (connected && publicKey) {
            if (publicKey.toBase58() === ADMIN_WALLET) {
                setIsAuthorized(true);
            } else {
                // If a non-admin wallet is connected, redirect them.
                router.push('/');
            }
        } else {
            // If no wallet is connected, they are not authorized yet but we show them the login button.
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
         // This state is reached if a non-admin wallet is connected and redirection is in progress.
         return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p>Unauthorized. Redirecting...</p>
                </div>
            </div>
        );
    }

    // If we get here, user is connected and authorized.
    return <>{children}</>;
}
