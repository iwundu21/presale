
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { setClientPresaleEndDate } from "@/services/presale-date-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPresaleInfo, setPresaleInfo, PresaleInfo } from "@/services/presale-info-service";

const SEASON_PRICES: { [key: string]: number } = {
    "Early Stage": 0.09,
    "Investors": 0.15,
    "Whale": 0.25,
};

export default function AdminPage() {
    const { toast } = useToast();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [season, setSeason] = useState("Early Stage");
    const [price, setPrice] = useState(SEASON_PRICES[season]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInfo = async () => {
            setIsLoading(true);
            try {
                const info = await getPresaleInfo();
                if (info) {
                    setSeason(info.seasonName);
                    setPrice(info.tokenPrice);
                }
            } catch (error) {
                console.error("Failed to fetch presale info", error);
                toast({
                    title: "Load Failed",
                    description: "Could not load current presale season info.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInfo();
    }, [toast]);
    
    const handleUpdateDate = () => {
        if (!date || !time) {
            toast({
                title: "Invalid Date/Time",
                description: "Please select both a date and a time.",
                variant: "destructive",
            });
            return;
        }

        try {
            const newEndDate = new Date(`${date}T${time}`);
            if (isNaN(newEndDate.getTime())) {
                throw new Error("Invalid date created.");
            }
            
            setClientPresaleEndDate(newEndDate);

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

    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
             <div className="flex items-center justify-between gap-3 mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="grid gap-8">
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
                            This change will be reflected for all users on their next visit.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <Input 
                            type="time" 
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                        <Button onClick={handleUpdateDate}>Update Date</Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
