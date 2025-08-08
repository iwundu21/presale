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


export default function AdminPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [currentEndDate, setCurrentEndDate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchCurrentDate() {
      try {
        const date = await getPresaleEndDate();
        setCurrentEndDate(date);
        setEndDate(date.toISOString().slice(0, 16));
      } catch (error) {
         console.error("Failed to fetch current end date", error);
         toast({
            title: 'Error fetching current date',
            description: 'Could not load the currently configured presale end date.',
            variant: 'destructive',
         });
      }
    }
    fetchCurrentDate();
  }, [toast]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updatePresaleConfig({ endDate });
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
          variant: 'success',
        });
        // Refetch the date to update the "Current value" text
        const newDate = await getPresaleEndDate();
        setCurrentEndDate(newDate);
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
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
