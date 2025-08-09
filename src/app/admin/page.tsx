
"use client";

import { useEffect, useState } from "react";
import { UserData, getAllUsers, setPresaleEndDate, getPresaleEndDate as getInitialPresaleEndDate } from "@/services/firestore-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Users, CalendarClock, KeyRound } from "lucide-react";

// The secret code is now stored in an environment variable for better security.
const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE;

export default function AdminPage() {
    const { toast } = useToast();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserData[]>([]);
    const [presaleEndDate, setPresaleEndDateState] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isUpdatingDate, setIsUpdatingDate] = useState(false);
    const [inputCode, setInputCode] = useState("");
    const [isCheckingCode, setIsCheckingCode] = useState(false);

    useEffect(() => {
        // Check session storage to see if user is already authenticated
        const sessionAuth = sessionStorage.getItem('adminAuthenticated');
        if (sessionAuth === 'true') {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);
    
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchAdminData = async () => {
            setIsLoadingUsers(true);
            try {
                const [userList, initialDate] = await Promise.all([
                    getAllUsers(),
                    getInitialPresaleEndDate()
                ]);
                
                setUsers(userList);

                if (initialDate) {
                    const formattedDate = new Date(initialDate.getTime() - (initialDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                    setPresaleEndDateState(formattedDate);
                }

            } catch (error) {
                console.error("Failed to fetch admin data:", error);
                toast({ title: "Error", description: "Could not fetch admin data.", variant: "destructive" });
            } finally {
                setIsLoadingUsers(false);
            }
        };
        
        fetchAdminData();
    }, [isAuthenticated, toast]);

    const handleLogin = () => {
        setIsCheckingCode(true);
        if (inputCode === ADMIN_CODE) {
            sessionStorage.setItem('adminAuthenticated', 'true');
            setIsAuthenticated(true);
            toast({ title: "Success", description: "Welcome, Admin!" });
        } else {
            toast({ title: "Error", description: "Invalid access code.", variant: "destructive" });
        }
        setIsCheckingCode(false);
    };
    
    const handleLogout = () => {
        sessionStorage.removeItem('adminAuthenticated');
        setIsAuthenticated(false);
        setInputCode("");
    };

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
    
    if (isLoading) {
        return (
             <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-sm shadow-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                           <KeyRound className="h-6 w-6 text-primary" />
                           <CardTitle className="text-2xl">Admin Access</CardTitle>
                        </div>
                        <CardDescription>Please enter the access code to manage the dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input 
                            type="password"
                            placeholder="••••••••"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        <Button onClick={handleLogin} disabled={isCheckingCode} className="w-full">
                            {isCheckingCode ? "Verifying..." : "Login"}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }
    
    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-3 mb-8">
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                </div>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
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
