
"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useWallet } from "@solana/wallet-adapter-react";
import { UserData, getAllUsers, setPresaleEndDate, getPresaleEndDate as getInitialPresaleEndDate } from "@/services/firestore-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Users, CalendarClock } from "lucide-react";

const ADMIN_WALLET_ADDRESS = "5Gy5qYXhYs7aPfEztAG6vTPVow5snudPksBvF5DAYLpX";

export default function AdminPage() {
    const { publicKey, connected, connecting } = useWallet();
    const router = useRouter();
    const { toast } = useToast();

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserData[]>([]);
    const [presaleEndDate, setPresaleEndDateState] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isUpdatingDate, setIsUpdatingDate] = useState(false);
    
    useEffect(() => {
        // This effect handles both authorization and data fetching.
        if (connecting) {
            return; // Wait until the wallet connection attempt is finished.
        }

        if (!connected || !publicKey) {
            // If not connected after trying, redirect to home page.
            toast({ title: "Admin Access Required", description: "Please connect your wallet to access the admin dashboard.", variant: "destructive" });
            router.push('/');
            return;
        }

        // At this point, a wallet is connected. Check for authorization.
        if (publicKey.toBase58() === ADMIN_WALLET_ADDRESS) {
            setIsAuthorized(true);

            // Fetch data now that we are authorized.
            const fetchAdminData = async () => {
                setIsLoadingUsers(true);
                try {
                    const [userList, initialDate] = await Promise.all([
                        getAllUsers(),
                        getInitialPresaleEndDate()
                    ]);
                    
                    setUsers(userList);

                    // Format to YYYY-MM-DDTHH:mm for datetime-local input
                    const formattedDate = new Date(initialDate.getTime() - (initialDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                    setPresaleEndDateState(formattedDate);

                } catch (error) {
                    console.error("Failed to fetch admin data:", error);
                    toast({ title: "Error", description: "Could not fetch admin data.", variant: "destructive" });
                } finally {
                    setIsLoadingUsers(false);
                }
            };
            
            fetchAdminData();
        } else {
            // Connected with a non-admin wallet.
            toast({ title: "Unauthorized", description: "This wallet is not authorized for the admin dashboard.", variant: "destructive" });
            router.push('/dashboard');
        }

        // All checks are done, loading is complete.
        setIsLoading(false);

    }, [publicKey, connected, connecting, router, toast]);

    const handleUpdateDate = async () => {
        if (!presaleEndDate) {
            toast({ title: "Error", description: "Please select a valid date.", variant: "destructive" });
            return;
        }
        setIsUpdatingDate(true);
        try {
            await setPresaleEndDate(new Date(presaleEndDate));
            toast({ title: "Success", description: "Presale end date has been updated." });
        } catch (error) {
            console.error("Failed to update date:", error);
            toast({ title: "Error", description: "Could not update the presale end date.", variant: "destructive" });
        } finally {
            setIsUpdatingDate(false);
        }
    };

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p>Verifying authorization...</p>
                </div>
            </div>
        );
    }
    
    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Users className="h-6 w-6 text-accent" />
                                <CardTitle>User Management</CardTitle>
                            </div>
                            <CardDescription>View all users who have connected to the presale.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg max-h-[600px] overflow-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-card">
                                        <TableRow>
                                            <TableHead>Wallet Address</TableHead>
                                            <TableHead className="text-right">EXN Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingUsers ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-1/4 ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : users.length > 0 ? (
                                            users.map((user) => (
                                                <TableRow key={user.walletAddress}>
                                                    <TableCell className="font-mono text-xs truncate max-w-[200px] sm:max-w-none">{user.walletAddress}</TableCell>
                                                    <TableCell className="text-right font-medium">{user.exnBalance.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center">No users found.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <CalendarClock className="h-6 w-6 text-accent" />
                                <CardTitle>Presale Management</CardTitle>
                            </div>
                            <CardDescription>Control the presale settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="presale-date" className="text-sm font-medium mb-2 block">Presale End Date</label>
                                <Input
                                    id="presale-date"
                                    type="datetime-local"
                                    value={presaleEndDate}
                                    onChange={(e) => setPresaleEndDateState(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleUpdateDate} disabled={isUpdatingDate} className="w-full">
                                {isUpdatingDate ? "Updating..." : "Update End Date"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
