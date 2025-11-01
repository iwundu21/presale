
import type {Metadata} from 'next';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/components/app-providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    template: '%s | Exnus Presale',
    default: 'Exnus Presale',
  },
  description: 'Purchase EXN Tokens',
  applicationName: 'Exnus Protocol Presale',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("font-body antialiased", inter.variable, 'min-h-screen flex flex-col')}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
