
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
import { CalendarIcon, Loader2, Settings, Download, ChevronLeft, ChevronRight, Edit, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "./ui/dialog";

type AdminData = {
    presaleInfo: PresaleInfo;
    isPresaleActive: boolean;
    presaleEndDate: string;
    auctionSlotsSold: number;
};

type UserData = {
    wallet: string;
    balance: number;
};

const USERS_PER_PAGE = 20;

export function AdminDashboard() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<AdminData | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const [seasonName, setSeasonName] = useState("");
    const [tokenPrice, setTokenPrice] = useState(0);
    const [hardCap, setHardCap] = useState(0);
    const [isPresaleActive, setIsPresaleActive] = useState(true);
    const [presaleEndDate, setPresaleEndDate] = useState<Date | undefined>(new Date());
    
    const [isUpdating, setIsUpdating] = useState({
        info: false,
        status: false,
        date: false,
        balance: false,
    });
    
    const [isDownloading, setIsDownloading] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [newBalance, setNewBalance] = useState<number>(0);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);

    const fetchAllAdminData = async () => {
        try {
            const [presaleDataRes, usersRes] = await Promise.all([
                fetch('/api/presale-data'),
                fetch('/api/all-users-data')
            ]);

            if (!presaleDataRes.ok) {
                throw new Error('Failed to fetch presale data');
            }
             if (!usersRes.ok) {
                throw new Error('Failed to fetch user data');
            }

            const presaleData = await presaleDataRes.json();
            const usersData = await usersRes.json();

            setData(presaleData);
            setUsers(usersData);
            
            if (presaleData.presaleInfo) {
                setSeasonName(presaleData.presaleInfo.seasonName);
                setTokenPrice(presaleData.presaleInfo.tokenPrice);
                setHardCap(presaleData.presaleInfo.hardCap);
            }
            setIsPresaleActive(presaleData.isPresaleActive);
            if (presaleData.presaleEndDate) {
                setPresaleEndDate(new Date(presaleData.presaleEndDate));
            }

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Could not load admin data. Please refresh.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setIsLoadingUsers(false);
        }
    }

    useEffect(() => {
        setIsLoading(true);
        setIsLoadingUsers(true);
        fetchAllAdminData();
    }, [toast]);
    
    const filteredUsers = users.filter(user =>
        user.wallet.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    );


    const handleUpdateInfo = async () => {
        setIsUpdating(prev => ({ ...prev, info: true }));
        try {
            const currentInfo = data?.presaleInfo || {};
            const res = await fetch('/api/presale-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    presaleInfo: { ...currentInfo, seasonName, tokenPrice, hardCap }
                }),
            });
            if (!res.ok) throw new Error('Failed to update presale info');
            const updatedData = await res.json();
            
            setData(updatedData);
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
            
            setData(updatedData);
            setIsPresaleActive(updatedData.isPresaleActive);

            toast({ title: "Success", description: `Presale is now ${newStatus ? 'active' : 'inactive'}.`, variant: "success" });
        } catch (error) {
             console.error(error);
             toast({ title: "Error", description: "Failed to update presale status.", variant: "destructive" });
             setIsPresaleActive(!newStatus);
        } finally {
             setIsUpdating(prev => ({ ...prev, status: false }));
        }
    }

    const handleUpdateDate = async () => {
        if (!presaleEndDate) return;
        setIsUpdating(prev => ({ ...prev, date: true }));
         try {
            const res = await fetch('/api/presale-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ presaleEndDate: presaleEndDate.toISOString() }),
            });
            if (!res.ok) throw new Error('Failed to update presale end date');
            const updatedData = await res.json();
            
            setData(updatedData);

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
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user data' }));
                throw new Error(errorData.message);
            }
            const usersToDownload: UserData[] = await response.json();

            if (usersToDownload.length === 0) {
                toast({ title: "No Data", description: "There are no users to export yet." });
                setIsDownloading(false);
                return;
            }

            const headers = ['wallet', 'balance'];
            const csvContent = [
                headers.join(','),
                ...usersToDownload.map(user => [user.wallet, user.balance].join(','))
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
            const errorMessage = error instanceof Error ? error.message : "Could not download user data.";
            toast({ title: "Download Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleEditUser = (user: UserData) => {
        setEditingUser(user);
        setNewBalance(user.balance);
        setIsEditUserDialogOpen(true);
    };

    const handleUpdateBalance = async () => {
        if (!editingUser) return;
        setIsUpdating(prev => ({ ...prev, balance: true }));
        try {
            const res = await fetch('/api/update-user-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: editingUser.wallet, balance: newBalance }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update balance');
            }
            const updatedUser = await res.json();
            
            setUsers(prevUsers => prevUsers.map(u => u.wallet === updatedUser.wallet ? { ...u, balance: updatedUser.balance } : u));
            
            await fetchAllAdminData();

            toast({ title: "Success", description: "User balance updated successfully.", variant: "success" });
            setIsEditUserDialogOpen(false);
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "Failed to update user balance.", variant: "destructive" });
        } finally {
            setIsUpdating(prev => ({ ...prev, balance: false }));
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
                        <CardDescription>Manage the general presale settings and stages.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="seasonName">Season Name</Label>
                                <Input id="seasonName" value={seasonName} onChange={(e) => setSeasonName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tokenPrice">Base Token Price (USD)</Label>
                                <Input id="tokenPrice" type="number" value={tokenPrice} onChange={(e) => setTokenPrice(parseFloat(e.target.value) || 0)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="hardCap">Hard Cap (Total Supply for Presale)</Label>
                                <Input id="hardCap" type="number" value={hardCap} onChange={(e) => setHardCap(parseInt(e.target.value, 10) || 0)} />
                            </div>
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
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>User Balances</CardTitle>
                            <CardDescription>A list of all registered users and their token balances.</CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by wallet..." 
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingUsers ? (
                             <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                {searchQuery ? "No users found for your search." : "No users found."}
                            </p>
                        ) : (
                            <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                                <>
                                    <ScrollArea className="h-[400px] w-full">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Wallet Address</TableHead>
                                                    <TableHead className="text-right">EXN Balance</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedUsers.map((user) => (
                                                    <TableRow key={user.wallet}>
                                                        <TableCell className="font-mono text-xs truncate max-w-[200px] sm:max-w-none">{user.wallet}</TableCell>
                                                        <TableCell className="text-right font-medium">{user.balance.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit User Balance</DialogTitle>
                                            <DialogDescription>
                                                Modify the token balance for the user. This is a permanent action.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="wallet" className="text-right">
                                                    Wallet
                                                </Label>
                                                <Input id="wallet" value={editingUser?.wallet || ''} readOnly className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="balance" className="text-right">
                                                    Balance
                                                </Label>
                                                <Input
                                                    id="balance"
                                                    type="number"
                                                    value={newBalance}
                                                    onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                                                    className="col-span-3"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant="secondary">Cancel</Button>
                                            </DialogClose>
                                            <Button onClick={handleUpdateBalance} disabled={isUpdating.balance}>
                                                {isUpdating.balance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Changes
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </>
                            </Dialog>
                        )}
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

    

