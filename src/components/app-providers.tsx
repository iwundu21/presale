
"use client";

import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ClientWalletProvider } from '@/components/client-wallet-provider';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation';
import { LandingPage } from './landing-page';
import { getPresaleData } from '@/services/presale-info-service';
import { getPresaleEndDate } from '@/services/presale-date-service';
import { useEffect, useState }from 'react';
import type { PresaleData } from '@/services/presale-info-service';

type AppProvidersProps = {
    children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
    const pathname = usePathname();
    const [presaleData, setPresaleData] = useState<PresaleData | null>(null);
    const [presaleEndDate, setPresaleEndDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (pathname === '/') {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [data, endDate] = await Promise.all([
                        getPresaleData(),
                        getPresaleEndDate(),
                    ]);
                    setPresaleData(data);
                    setPresaleEndDate(endDate);
                } catch (error) {
                    console.error("Failed to fetch landing page data", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [pathname]);

    return (
        <AppRouterCacheProvider>
          <ClientWalletProvider>
            <div className="flex-grow flex flex-col min-h-screen">
              <AppHeader />
              <main className="flex-grow flex flex-col">
                {pathname === '/' ? (
                    <>
                        {isLoading || !presaleData || !presaleEndDate ? (
                            <div className="flex-grow flex items-center justify-center text-white">Loading...</div>
                        ) : (
                            <LandingPage 
                                presaleEndDate={presaleEndDate}
                                presaleInfo={presaleData.presaleInfo}
                                isPresaleActive={presaleData.isPresaleActive}
                            />
                        )}
                    </>
                ) : (
                    children
                )}
              </main>
              <AppFooter />
            </div>
            <Toaster />
          </ClientWalletProvider>
        </AppRouterCacheProvider>
    )
}
