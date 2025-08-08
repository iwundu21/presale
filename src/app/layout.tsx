
import type {Metadata} from 'next';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { WalletProvider } from '@/components/wallet-provider';

export const metadata: Metadata = {
  title: 'Exnus',
  description: 'Purchase EXN Tokens',
  applicationName: 'Exnus',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", 'min-h-screen')}>
        <AppRouterCacheProvider>
          <WalletProvider>
            {children}
            <Toaster />
          </WalletProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
