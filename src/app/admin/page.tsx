
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import { getPresaleEndDate, setPresaleEndDate } from '@/services/presale-date-service';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

const ADMIN_WALLET_ADDRESS = "9Kqt28pfMVBsBvXYYnYQCT2BZyorAwzbR6dUmgQfsZYW";

// Helper to format date for datetime-local input
const toDateTimeLocal = (date: Date): string => {
  const ten = (i: number) => (i < 10 ? '0' : '') + i;
  const YYYY = date.getFullYear();
  const MM = ten(date.getMonth() + 1);
  const DD = ten(date.getDate());
  const HH = ten(date.getHours());
  const mm = ten(date.getMinutes());
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
};


export default function AdminPage() {
  const [currentEndDate, setCurrentEndDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { publicKey, connected, connecting } = useWallet();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [endDateInput, setEndDateInput] = useState('');

  useEffect(() => {
    const date = getPresaleEndDate();
    setCurrentEndDate(date);
    setEndDateInput(toDateTimeLocal(date));
  }, []);
  
  useEffect(() => {
    if (!connecting) {
      if (!connected) {
        router.push('/');
      } else if (publicKey && publicKey.toBase58() === ADMIN_WALLET_ADDRESS) {
        setIsAuthorized(true);
      } else {
        router.push('/dashboard');
      }
    }
  }, [publicKey, connected, connecting, router]);


  const handleDateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newDate = new Date(endDateInput);
      setPresaleEndDate(newDate); // This now updates in-memory
      toast({
        title: 'Configuration Updated',
        description: 'Presale end date has been updated for this session.',
        variant: 'success',
      });
      setCurrentEndDate(newDate);
      
    } catch (error: any) {
      toast({
        title: 'Error updating config',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!publicKey) return;
    setIsDownloading(true);
    try {
        const response = await fetch('/api/export', {
            headers: {
                'x-admin-wallet': publicKey.toBase58()
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to download: ${errorText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = 'exnus_user_data.csv';
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch.length > 1) {
                fileName = fileNameMatch[1];
            }
        }
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        toast({
            title: 'Download Started',
            description: 'Your user data CSV is downloading.',
            variant: 'success'
        });
    } catch (error: any) {
        toast({
            title: 'Download Failed',
            description: error.message || "An unknown error occurred.",
            variant: 'destructive'
        });
    } finally {
        setIsDownloading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying authorization...</p>
          </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto space-y-8">
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Presale Configuration</CardTitle>
            <CardDescription>Configure the presale end date and time for the current session.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDateSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-white">Presale End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="bg-input border-border"
                  required
                />
                 {currentEndDate && <p className="text-xs text-muted-foreground pt-1">
                    Current value: {currentEndDate.toLocaleString()}
                </p>}
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-primary/20">
           <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">User Data</CardTitle>
            <CardDescription>Download a CSV of all user wallet addresses and balances.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownload} className="w-full" variant="secondary" disabled={isDownloading}>
                {isDownloading ? <Loader2 className="animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {isDownloading ? 'Exporting...' : 'Download User Data (CSV)'}
            </Button>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
