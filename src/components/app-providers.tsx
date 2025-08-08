
"use client";

import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ClientWalletProvider } from '@/components/client-wallet-provider';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Toaster } from "@/components/ui/toaster";

type AppProvidersProps = {
    children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <AppRouterCacheProvider>
          <ClientWalletProvider>
            <AppHeader />
            <div className="flex-grow">
              {children}
            </div>
            <AppFooter />
            <Toaster />
          </ClientWalletProvider>
        </AppRouterCacheProvider>
    )
}
