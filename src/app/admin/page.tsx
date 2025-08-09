
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { setPresaleEndDate } from "@/services/presale-date-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPresaleData, setPresaleInfo, setPresaleStatus } from "@/services/presale-info-service";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download } from "lucide-react";

const SEASON_PRICES: { [key: string]: number } = {
    "Early Stage": 0.09,
    "Investors": 0.15,
    "Whale": 0.25,
};

type UserData = {
    [wallet: string]: {
        balance: number;
        transactions: any[];
    }
}

export default function AdminPage() {
    const { toast } = useToast();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [season, setSeason] = useState("Early Stage");
    const [price, setPrice] = useState(SEASON_PRICES[season]);
    const [isPresaleActive, setIsPresaleActive] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingDate, setIsUpdatingDate] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchInfo = async () => {
            setIsLoading(true);
            try {
                const data = await getPresaleData();
                if (data) {
                    setSeason(data.presaleInfo.seasonName);
                    setPrice(data.presaleInfo.tokenPrice);
                    setIsPresaleActive(data.isPresaleActive);
                }
            } catch (error) {
                console.error("Failed to fetch presale info", error);
                toast({
                    title: "Load Failed",
                    description: "Could not load current presale data.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInfo();
    }, [toast]);
    
    const handleUpdateDate = async () => {
        if (!date || !time) {
            toast({
                title: "Invalid Date/Time",
                description: "Please select both a date and a time.",
                variant: "destructive",
            });
            return;
        }

        setIsUpdatingDate(true);
        try {
            const newEndDate = new Date(`${date}T${time}`);
            if (isNaN(newEndDate.getTime())) {
                throw new Error("Invalid date created.");
            }
            
            await setPresaleEndDate(newEndDate);

            toast({
                title: "Success",
                description: `Presale end date updated to ${newEndDate.toLocaleString()}`,
                variant: "success",
            });

        } catch (error) {
            console.error("Failed to update date", error);
            toast({
                title: "Update Failed",
                description: "The date or time format is invalid. Please check and try again.",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingDate(false);
        }
    };
    
    const handleSeasonChange = (newSeason: string) => {
        setSeason(newSeason);
        setPrice(SEASON_PRICES[newSeason]);
    };

    const handleUpdateSeason = async () => {
        setIsLoading(true);
        try {
            await setPresaleInfo({ seasonName: season, tokenPrice: price });
            toast({
                title: "Success",
                description: `Presale season updated to ${season} with price $${price}.`,
                variant: "success",
            });
        } catch (error) {
            console.error("Failed to update season", error);
            toast({
                title: "Update Failed",
                description: "Could not update the presale season. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (checked: boolean) => {
        setIsUpdatingStatus(true);
        try {
            await setPresaleStatus(checked);
            setIsPresaleActive(checked);
            toast({
                title: "Success",
                description: `Presale has been ${checked ? 'enabled' : 'disabled'}.`,
                variant: "success",
            });
        } catch (error) {
            console.error("Failed to update presale status", error);
            toast({
                title: "Update Failed",
                description: "Could not update the presale status.",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingStatus(false);
        }
    }

    const handleDownloadData = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch('/api/admin/all-users');
            if (!response.ok) {
                throw new Error("Failed to fetch user data.");
            }

            const users: UserData = await response.json();
            
            let csvContent = "wallet_address,exn_balance\n";
            for(const wallet in users) {
                if (users[wallet].balance > 0) {
                    csvContent += `${wallet},${users[wallet].balance}\n`;
                }
            }
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "presale_balances.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            toast({
                title: "Download Started",
                description: "The presale user data CSV is being downloaded.",
                variant: "success"
            });

        } catch (error: any) {
             console.error("Failed to download data", error);
            toast({
                title: "Download Failed",
                description: error.message || "Could not download the user data.",
                variant: "destructive",
            });
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
             <div className="flex items-center justify-between gap-3 mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="grid gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Export Presale Data</CardTitle>
                        <CardDescription>
                            Download a CSV file of all user wallets and their corresponding EXN token balances for airdrop or smart contract distribution.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleDownloadData} disabled={isDownloading}>
                            <Download className="mr-2 h-4 w-4"/>
                            {isDownloading ? "Downloading..." : "Download User Data (CSV)"}
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Presale Control</CardTitle>
                        <CardDescription>
                            Enable or disable the token presale for all users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                           <Switch 
                             id="presale-status" 
                             checked={isPresaleActive}
                             onCheckedChange={handleStatusChange}
                             disabled={isUpdatingStatus || isLoading}
                           />
                           <Label htmlFor="presale-status" className="text-base">
                             {isPresaleActive ? "Presale is Active" : "Presale is Inactive"}
                           </Label>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Presale Season</CardTitle>
                        <CardDescription>
                            Select the current presale season. The token price will update automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-end gap-4">
                       <div className="grid w-full max-w-sm items-center gap-1.5">
                            <label htmlFor="season">Season</label>
                            <Select value={season} onValueChange={handleSeasonChange} disabled={isLoading}>
                                <SelectTrigger id="season">
                                    <SelectValue placeholder="Select a season" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(SEASON_PRICES).map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                       </div>
                       <div className="grid w-full max-w-xs items-center gap-1.5">
                           <label htmlFor="price">Token Price ($)</label>
                           <Input id="price" type="number" value={price} readOnly disabled/>
                       </div>
                        <Button onClick={handleUpdateSeason} disabled={isLoading}>
                            {isLoading ? "Updating..." : "Update Season"}
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Update Presale End Date</CardTitle>
                        <CardDescription>
                            Set a new end date and time for the token presale countdown. 
                            This change will be reflected for all users globally.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={isUpdatingDate}
                        />
                        <Input 
                            type="time" 
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            disabled={isUpdatingDate}
                        />
                        <Button onClick={handleUpdateDate} disabled={isUpdatingDate}>
                           {isUpdatingDate ? 'Updating...' : 'Update Date'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
