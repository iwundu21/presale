
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updatePresaleConfig } from '@/ai/flows/update-presale-config';
import { Loader2 } from 'lucide-react';
import { getPresaleEndDate } from '@/services/presale-date-service';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

const ADMIN_WALLET_ADDRESS = "9Kqt28pfMVBsBvXYYnYQCT2BZyorAwzbR6dUmgQfsZYW";

async function fetchCurrentDate() {
    return getPresaleEndDate();
}

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
  const { toast } = useToast();
  const router = useRouter();
  const { publicKey, connected, connecting } = useWallet();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Use state to manage the form input value
  const [endDateInput, setEndDateInput] = useState('');

  // Fetch and set the date on initial component mount
  useEffect(() => {
    async function loadDate() {
      const date = await fetchCurrentDate();
      setCurrentEndDate(date);
      setEndDateInput(toDateTimeLocal(date));
    }
    loadDate();
  }, []);
  
  useEffect(() => {
    if (!connecting) {
      if (!connected) {
        // If not connected, redirect to home to connect wallet
        router.push('/');
      } else if (publicKey && publicKey.toBase58() === ADMIN_WALLET_ADDRESS) {
        setIsAuthorized(true);
      } else {
        // If connected with a non-admin wallet, redirect to user dashboard
        router.push('/dashboard');
      }
    }
  }, [publicKey, connected, connecting, router]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updatePresaleConfig({ endDate: endDateInput });
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
          variant: 'success',
        });
        // Refetch the date to update the "Current value" text
        const newDate = await fetchCurrentDate();
        setCurrentEndDate(newDate);
        router.refresh(); // Force a server-side refresh of the page
      } else {
        throw new Error(result.message);
      }
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
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Admin Dashboard</CardTitle>
            <CardDescription>Configure the presale settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
      </div>
    </main>
  );
}

