
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { setPresaleEndDate } from "@/services/presale-date-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPresaleData, setPresaleInfo, setPresaleStatus } from "@/services/presale-info-service";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, ChevronLeft, ChevronRight, KeyRound, Edit, ChevronsUpDown, CheckCircle, AlertCircle, Clock, Search, ExternalLink, Gift, Award, Copy, View, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "./dashboard-client-provider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Separator } from "./ui/separator";

const SEASON_PRICES: { [key: string]: number } = {
    "Early Stage": 0.09,
    "Investors": 0.15,
    "Whale": 0.25,
};

type UserAdminView = {
    wallet: string;
    balance: number;
    transactions: Transaction[];
}

type FoundTransaction = Transaction & {
    user: {
        wallet: string;
    }
};

const USERS_PER_PAGE = 20;

const getStatusBadgeVariant = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed': return 'success';
        case 'Pending': return 'secondary';
        case 'Failed': return 'destructive';
        default: return 'outline';
    }
}

const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
        case 'Failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
        case 'Pending': return <Clock className="h-4 w-4 text-yellow-400" />;
    }
}

export function AdminDashboard() {
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
    
    // Passcode state
    const [currentPasscode, setCurrentPasscode] = useState('');
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmNewPasscode, setConfirmNewPasscode] = useState('');
    const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);


    // User table state
    const [users, setUsers] = useState<UserAdminView[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Transaction Search State
    const [txSearchQuery, setTxSearchQuery] = useState('');
    const [isSearchingTx, setIsSearchingTx] = useState(false);
    const [foundTx, setFoundTx] = useState<FoundTransaction | null>(null);
    const [txSearchError, setTxSearchError] = useState('');

    // Update Balance State
    const [walletToUpdate, setWalletToUpdate] = useState('');
    const [newBalance, setNewBalance] = useState('');
    const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

    const fetchUsers = useCallback(async (page: number, query: string) => {
        setIsLoadingUsers(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: USERS_PER_PAGE.toString(),
                searchQuery: query
            });

            const response = await fetch(`/api/admin/all-users?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch user data.");
            }
            const data = await response.json();
            setUsers(data.users);
            setTotalPages(Math.ceil(data.total / USERS_PER_PAGE));
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast({
                title: "User Load Failed",
                description: "Could not load the user list.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingUsers(false);
        }
    }, [toast]);


    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const presaleDataRes = await getPresaleData();
                
                if (presaleDataRes) {
                    setSeason(presaleDataRes.presaleInfo.seasonName);
                    setPrice(presaleDataRes.presaleInfo.tokenPrice);
                    setIsPresaleActive(presaleDataRes.isPresaleActive);
                }

            } catch (error) {
                console.error("Failed to fetch initial admin data", error);
                toast({
                    title: "Load Failed",
                    description: "Could not load current presale data.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [toast]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
             fetchUsers(currentPage, searchQuery);
        }, 300); // Debounce search
        return () => clearTimeout(handler);
    }, [currentPage, searchQuery, fetchUsers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };
    
    const handleCopyToClipboard = (text: string, entity: string = "Wallet address") => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: `${entity} copied to clipboard.`,
            variant: "success",
        });
    };

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
            const response = await fetch('/api/admin/all-users?limit=0');
            if (!response.ok) {
                throw new Error("Failed to fetch user data for download.");
            }

            const usersData = await response.json();
            const allUsers: UserAdminView[] = usersData.users || [];
            
            let csvContent = "wallet_address,exn_balance\n";
            for(const user of allUsers) {
                csvContent += `${user.wallet},${user.balance}\n`;
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
    
    const handleUpdatePasscode = async () => {
        if (!currentPasscode || !newPasscode || !confirmNewPasscode) {
             toast({ title: "Error", description: "All passcode fields are required.", variant: "destructive" });
             return;
        }
        if (newPasscode !== confirmNewPasscode) {
            toast({ title: "Error", description: "New passcodes do not match.", variant: "destructive" });
            return;
        }
         if (newPasscode.length < 6) {
            toast({ title: "Error", description: "New passcode must be at least 6 characters.", variant: "destructive" });
            return;
        }

        setIsUpdatingPasscode(true);
        try {
            const response = await fetch('/api/admin/update-passcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPasscode, newPasscode })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update passcode.");
            }
            
            toast({ title: "Success", description: "Admin passcode has been updated.", variant: "success" });
            setCurrentPasscode('');
            setNewPasscode('');
            setConfirmNewPasscode('');

        } catch(error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsUpdatingPasscode(false);
        }
    }

    const handleUpdateBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletToUpdate || !newBalance) {
            toast({ title: "Error", description: "Wallet address and new balance are required.", variant: "destructive" });
            return;
        }
        const balanceNum = parseFloat(newBalance);
         if (isNaN(balanceNum) || balanceNum < 0) {
            toast({ title: "Error", description: "Please enter a valid, non-negative number for the balance.", variant: "destructive" });
            return;
        }

        setIsUpdatingBalance(true);
        try {
            const response = await fetch(`/api/admin/update-balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: walletToUpdate, newBalance: balanceNum })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update balance.');
            }
            toast({ title: "Success", description: data.message, variant: "success" });
            setWalletToUpdate('');
            setNewBalance('');
            // Refresh user list to show the change
            fetchUsers(currentPage, searchQuery);
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsUpdatingBalance(false);
        }
    }

    const handleTxSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!txSearchQuery) return;
        
        setIsSearchingTx(true);
        setTxSearchError('');
        setFoundTx(null);
        try {
            const response = await fetch(`/api/admin/find-transaction?txId=${txSearchQuery}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to find transaction.');
            }
            setFoundTx(data);
        } catch (error: any) {
            setTxSearchError(error.message);
        } finally {
            setIsSearchingTx(false);
        }
    };


    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Lookup</CardTitle>
                        <CardDescription>
                            Find a specific transaction by its ID to view its details and associated user.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTxSearch} className="flex items-start gap-4">
                            <div className="grid w-full max-w-lg items-center gap-1.5">
                                <Label htmlFor="tx-search">Transaction ID</Label>
                                <Input
                                    id="tx-search"
                                    type="text"
                                    placeholder="Enter transaction signature or ID..."
                                    value={txSearchQuery}
                                    onChange={(e) => setTxSearchQuery(e.target.value)}
                                    disabled={isSearchingTx}
                                />
                            </div>
                            <Button type="submit" disabled={isSearchingTx} className="self-end">
                                <Search className="mr-2 h-4 w-4"/>
                                {isSearchingTx ? "Searching..." : "Search"}
                            </Button>
                        </form>
                        {isSearchingTx && (
                            <div className="mt-4">
                                <Skeleton className="h-24 w-full" />
                            </div>
                        )}
                        {txSearchError && (
                            <p className="mt-4 text-center text-red-500">{txSearchError}</p>
                        )}
                        {foundTx && (
                            <Card className="mt-6 bg-muted/50">
                                <CardHeader>
                                    <CardTitle>Transaction Found</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">User Wallet</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm">{foundTx.user.wallet}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyToClipboard(foundTx.user.wallet, 'Wallet address')}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                         <Separator />
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Transaction ID</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm truncate max-w-[200px] sm:max-w-xs">{foundTx.id}</span>
                                                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyToClipboard(foundTx.id, 'Transaction ID')}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Details</span>
                                            <span>Purchased {foundTx.amountExn.toLocaleString()} EXN for {foundTx.paidAmount.toLocaleString()} {foundTx.paidCurrency}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Date</span>
                                            <span>{new Date(foundTx.date).toLocaleString()}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge variant={getStatusBadgeVariant(foundTx.status)} className="gap-1.5 cursor-pointer">
                                                {getStatusIcon(foundTx.status)}
                                                {foundTx.status}
                                            </Badge>
                                        </div>
                                         {foundTx.failureReason && (
                                            <>
                                            <Separator />
                                            <div className="flex justify-between items-start">
                                                <span className="text-muted-foreground">Reason</span>
                                                <span className="text-right text-red-400 max-w-xs break-words">{foundTx.failureReason}</span>
                                            </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>User Balances</CardTitle>
                        <CardDescription>
                           A list of all users who have participated in the presale. Click 'View' to expand and see transaction history.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by wallet address..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="border rounded-md">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-right">EXN Balance</TableHead>
                                        <TableHead className="w-[100px] text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                {isLoadingUsers ? (
                                    <TableBody>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-1/4 ml-auto" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-3/4 mx-auto" /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                ) : users.length > 0 ? (
                                    users.map(user => (
                                        <Collapsible asChild key={user.wallet} tagName="tbody">
                                            <>
                                                <TableRow>
                                                    <TableCell className="font-mono text-xs max-w-xs truncate">
                                                        <div className="flex items-center gap-2">
                                                            <span className="truncate">{user.wallet}</span>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyToClipboard(user.wallet, 'Wallet address')}>
                                                                            <Copy className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>Copy Address</p></TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">{user.balance.toLocaleString()}</TableCell>
                                                    <TableCell className="text-center">
                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="outline" size="sm" disabled={user.transactions.length === 0}>
                                                                <History className="h-4 w-4 mr-2" />
                                                                History
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    </TableCell>
                                                </TableRow>
                                                <CollapsibleContent asChild>
                                                    <tr className="bg-muted/50">
                                                        <TableCell colSpan={3} className="p-0">
                                                            <div className="p-4">
                                                                <h4 className="font-semibold mb-2">Transaction History ({user.transactions.length})</h4>
                                                                {user.transactions.length > 0 ? (
                                                                <TooltipProvider>
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead>Tx ID</TableHead>
                                                                                <TableHead>Details</TableHead>
                                                                                <TableHead>Status</TableHead>
                                                                                <TableHead>Explorer</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {user.transactions.map(tx => (
                                                                                <TableRow key={tx.id}>
                                                                                     <TableCell className="font-mono text-xs">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="truncate max-w-[100px]">{tx.id}</span>
                                                                                            <Tooltip>
                                                                                                <TooltipTrigger asChild>
                                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyToClipboard(tx.id, "Transaction ID")}>
                                                                                                        <Copy className="h-3 w-3" />
                                                                                                    </Button>
                                                                                                </TooltipTrigger>
                                                                                                <TooltipContent><p>Copy Tx ID</p></TooltipContent>
                                                                                            </Tooltip>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <p>{tx.amountExn.toLocaleString()} EXN</p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            {new Date(tx.date).toLocaleString()}
                                                                                        </p>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Badge variant={getStatusBadgeVariant(tx.status)} className="gap-1.5 cursor-pointer">
                                                                                            {getStatusIcon(tx.status)}
                                                                                            {tx.status}
                                                                                        </Badge>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={tx.id.startsWith('tx_')} asChild>
                                                                                                    <a href={`https://solscan.io/tx/${tx.id}`} target="_blank" rel="noopener noreferrer" >
                                                                                                        <ExternalLink className="h-4 w-4" />
                                                                                                    </a>
                                                                                                </Button>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent>
                                                                                                <p>View on Solscan</p>
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </TooltipProvider>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground text-center p-4">No transactions recorded for this user.</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </tr>
                                                </CollapsibleContent>
                                            </>
                                        </Collapsible>
                                    ))
                                ) : (
                                    <TableBody>
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                )}
                            </Table>
                        </div>
                         {totalPages > 0 && (
                            <div className="flex items-center justify-end space-x-2 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={()={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                                    onClick={()={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Update User Balance</CardTitle>
                        <CardDescription>
                            Manually set the EXN balance for a specific user wallet. Use with caution.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateBalance} className="flex flex-col sm:flex-row items-end gap-4">
                            <div className="grid w-full max-w-md items-center gap-1.5">
                                <Label htmlFor="wallet-address">Wallet Address</Label>
                                <Input
                                    id="wallet-address"
                                    type="text"
                                    placeholder="Enter user's wallet address"
                                    value={walletToUpdate}
                                    onChange={(e) => setWalletToUpdate(e.target.value)}
                                    disabled={isUpdatingBalance}
                                />
                            </div>
                             <div className="grid w-full max-w-xs items-center gap-1.5">
                                <Label htmlFor="new-balance">New EXN Balance</Label>
                                <Input
                                    id="new-balance"
                                    type="number"
                                    placeholder="e.g., 50000"
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(e.target.value)}
                                    disabled={isUpdatingBalance}
                                />
                            </div>
                            <Button type="submit" disabled={isUpdatingBalance}>
                                <Edit className="mr-2 h-4 w-4"/>
                                {isUpdatingBalance ? "Updating..." : "Update Balance"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
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
                            {isDownloading ? "Downloading..." : "Download All User Data (CSV)"}
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
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-6 w-6 text-primary" />
                            <CardTitle>Change Admin Passcode</CardTitle>
                        </div>
                        <CardDescription>
                           Update the passcode used to access this dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-sm">
                        <div className="space-y-2">
                            <Label htmlFor="current-passcode">Current Passcode</Label>
                            <Input
                                id="current-passcode"
                                type="password"
                                value={currentPasscode}
                                onChange={(e) => setCurrentPasscode(e.target.value)}
                                disabled={isUpdatingPasscode}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-passcode">New Passcode</Label>
                            <Input
                                id="new-passcode"
                                type="password"
                                value={newPasscode}
                                onChange={(e) => setNewPasscode(e.target.value)}
                                disabled={isUpdatingPasscode}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-new-passcode">Confirm New Passcode</Label>
                            <Input
                                id="confirm-new-passcode"
                                type="password"
                                value={confirmNewPasscode}
                                onChange={(e) => setConfirmNewPasscode(e.target.value)}
                                disabled={isUpdatingPasscode}
                            />
                        </div>
                        <Button onClick={handleUpdatePasscode} disabled={isUpdatingPasscode}>
                            {isUpdatingPasscode ? "Updating..." : "Update Passcode"}
                        </Button>
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
                            <Label htmlFor="season">Season</Label>
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
                           <Label htmlFor="price">Token Price ($)</Label>
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

    