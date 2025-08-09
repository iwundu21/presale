
import type {Metadata} from 'next';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/components/app-providers';

export const metadata: Metadata = {
  title: {
    template: '%s | Exnus Presale',
    default: 'Exnus Presale',
  },
  description: 'Purchase EXN Tokens',
  applicationName: 'Exnus Protocol Presale',
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
      <body className={cn("font-body antialiased", 'min-h-screen flex flex-col')}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
