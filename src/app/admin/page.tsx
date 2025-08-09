
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { setClientPresaleEndDate } from "@/services/presale-date-service";


export default function AdminPage() {
    const { toast } = useToast();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    
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


    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
             <div className="flex items-center justify-between gap-3 mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="grid gap-8">
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

                 <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            User management functionality is not yet implemented.
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

