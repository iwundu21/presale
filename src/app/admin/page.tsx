'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updatePresaleConfig } from '@/ai/flows/update-presale-config';
import { PRESALE_END_DATE } from '@/presale-config';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize state with the current date from config, formatted for the input
  const [endDate, setEndDate] = useState(PRESALE_END_DATE.toISOString().slice(0, 16));

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
                 <p className="text-xs text-muted-foreground pt-1">
                    Current value: {new Date(PRESALE_END_DATE).toLocaleString()}
                </p>
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
