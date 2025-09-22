

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { PresaleInfo } from "@/services/presale-info-service";
import { Switch } from "./ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { CalendarIcon, Loader2, Settings, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type AdminData = {
    presaleInfo: PresaleInfo;
    isPresaleActive: boolean;
    presaleEndDate: string;
};

type UserData = {
    wallet: string;
    balance: number;
};

export function AdminDashboard() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<AdminData | null>(null);

    const [seasonName, setSeasonName] = useState("");
    const [tokenPrice, setTokenPrice] = useState(0);
    const [hardCap, setHardCap] = useState(0);
    const [isPresaleActive, setIsPresaleActive] = useState(true);
    const [presaleEndDate, setPresaleEndDate] = useState<Date | undefined>(new Date());
    
    const [isUpdating, setIsUpdating] = useState({
        info: false,
        status: false,
        date: false,
    });
    
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [presaleDataRes, presaleDateRes] = await Promise.all([
                    fetch('/api/presale-data'),
                    fetch('/api/presale-date')
                ]);

                if (!presaleDataRes.ok || !presaleDateRes.ok) {
                    throw new Error('Failed to fetch initial admin data');
                }

                const presaleData = await presaleDataRes.json();
                const presaleDateData = await presaleDateRes.json();

                setData({
                    presaleInfo: presaleData.presaleInfo,
                    isPresaleActive: presaleData.isPresaleActive,
                    presaleEndDate: presaleDateData.presaleEndDate
                });
                
                setSeasonName(presaleData.presaleInfo.seasonName);
                setTokenPrice(presaleData.presaleInfo.tokenPrice);
                setHardCap(presaleData.presaleInfo.hardCap);
                setIsPresaleActive(presaleData.isPresaleActive);
                setPresaleEndDate(new Date(presaleDateData.presaleEndDate));

            } catch (error) {
                console.error(error);
                toast({
                    title: "Error",
                    description: "Could not load admin data. Please refresh.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const handleUpdateInfo = async () => {
        setIsUpdating(prev => ({ ...prev, info: true }));
        try {
            const res = await fetch('/api/presale-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    presaleInfo: { seasonName, tokenPrice, hardCap }
                }),
            });
            if (!res.ok) throw new Error('Failed to update presale info');
            const updatedData = await res.json();
            
            setData(d => d ? { ...d, presaleInfo: updatedData.presaleInfo } : null);

            toast({ title: "Success", description: "Presale info updated successfully.", variant: "success" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to update presale info.", variant: "destructive" });
        } finally {
            setIsUpdating(prev => ({ ...prev, info: false }));
        }
    };
    
    const handleTogglePresaleStatus = async (newStatus: boolean) => {
        setIsUpdating(prev => ({ ...prev, status: true }));
        try {
             const res = await fetch('/api/presale-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPresaleActive: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update presale status');
            const updatedData = await res.json();
            
            setData(d => d ? { ...d, isPresaleActive: updatedData.isPresaleActive } : null);
            setIsPresaleActive(updatedData.isPresaleActive);

            toast({ title: "Success", description: `Presale is now ${newStatus ? 'active' : 'inactive'}.`, variant: "success" });
        } catch (error) {
             console.error(error);
             toast({ title: "Error", description: "Failed to update presale status.", variant: "destructive" });
             // Revert UI on failure
             setIsPresaleActive(!newStatus);
        } finally {
             setIsUpdating(prev => ({ ...prev, status: false }));
        }
    }

    const handleUpdateDate = async () => {
        if (!presaleEndDate) return;
        setIsUpdating(prev => ({ ...prev, date: true }));
         try {
            const res = await fetch('/api/presale-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ presaleEndDate: presaleEndDate.toISOString() }),
            });
            if (!res.ok) throw new Error('Failed to update presale end date');
            const updatedData = await res.json();
            
            setData(d => d ? { ...d, presaleEndDate: updatedData.presaleEndDate } : null);

            toast({ title: "Success", description: "Presale end date updated.", variant: "success" });
        } catch (error) {
             console.error(error);
             toast({ title: "Error", description: "Failed to update end date.", variant: "destructive" });
        } finally {
             setIsUpdating(prev => ({ ...prev, date: false }));
        }
    };
    
    const handleDownloadCsv = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch('/api/all-users-data');
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const users: UserData[] = await response.json();

            if (users.length === 0) {
                toast({ title: "No Data", description: "There are no users to export yet." });
                return;
            }

            const headers = ['wallet', 'balance'];
            const csvContent = [
                headers.join(','),
                ...users.map(user => [user.wallet, user.balance].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'user-balances.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: "Success", description: "User balances CSV downloaded.", variant: "success" });

        } catch (error) {
            console.error("Failed to download CSV", error);
            toast({ title: "Download Failed", description: "Could not download user data.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Presale Configuration</CardTitle>
                        <CardDescription>Manage the presale settings and stages.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="seasonName">Season Name</Label>
                            <Input id="seasonName" value={seasonName} onChange={(e) => setSeasonName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tokenPrice">Token Price (USD)</Label>
                            <Input id="tokenPrice" type="number" value={tokenPrice} onChange={(e) => setTokenPrice(parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="hardCap">Hard Cap (Total Supply for Presale)</Label>
                            <Input id="hardCap" type="number" value={hardCap} onChange={(e) => setHardCap(parseInt(e.target.value, 10) || 0)} />
                        </div>
                        <Button onClick={handleUpdateInfo} disabled={isUpdating.info}>
                            {isUpdating.info && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Presale Info
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <CardTitle>Presale Controls</CardTitle>
                         <CardDescription>Activate or deactivate the presale and set the end date.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4 rounded-md border p-4">
                            <Settings />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                 Presale Active Status
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Turn the ability to purchase tokens on or off globally.
                                </p>
                            </div>
                            <Switch
                                checked={isPresaleActive}
                                onCheckedChange={handleTogglePresaleStatus}
                                disabled={isUpdating.status}
                                aria-readonly
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Presale End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !presaleEndDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {presaleEndDate ? format(presaleEndDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={presaleEndDate}
                                    onSelect={setPresaleEndDate}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button onClick={handleUpdateDate} disabled={isUpdating.date}>
                            {isUpdating.date && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update End Date
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Data Export</CardTitle>
                        <CardDescription>Download user contribution data for token distribution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleDownloadCsv} disabled={isDownloading}>
                            {isDownloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Download User Balances (CSV)
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
