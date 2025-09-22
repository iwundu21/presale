
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

        if (!connected || !publicKey) {
            router.push('/');
            return;
        }

        if (publicKey.toBase58() === ADMIN_WALLET) {
            setIsAuthorized(true);
        } else {
            router.push('/');
        }
        
        setIsLoading(false);

    }, [publicKey, connected, connecting, router]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    {isLoading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                            <p>Verifying authorization...</p>
                        </>
                    ) : (
                        <p>Unauthorized. Redirecting...</p>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
