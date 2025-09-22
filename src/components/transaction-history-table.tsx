

"use client";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, CheckCircle, AlertCircle, Clock, ExternalLink, TrendingUp, HelpCircle, RefreshCw, Copy, Award, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useDashboard, Transaction } from "./dashboard-client-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

const TRANSACTIONS_PER_PAGE = 10;

const getStatusBadgeVariant = (status: Transaction['status']): BadgeProps['variant'] => {
    switch (status) {
        case 'Completed': return 'success';
        case 'Failed': return 'destructive';
        default: return 'outline';
    }
}

const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
        case 'Failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
}

function TransactionRow({ tx }: { tx: Transaction }) {
    const { toast } = useToast();

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "Transaction ID copied to clipboard.",
            variant: "success",
        });
    };

    const isLinkDisabled = tx.id.startsWith('tx_');

    return (
        <TableRow key={tx.id}>
            <TableCell>
                <div className="font-medium text-white flex items-center gap-4">
                     <div className="p-2 bg-muted/50 rounded-md">
                        <TrendingUp className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                        <p>
                           {`${tx.status === 'Completed' ? 'Purchased' : 'Attempted'} ${tx.amountExn.toLocaleString()} EXN`}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <p className="text-xs text-muted-foreground">
                                {`Paid ${tx.paidAmount.toLocaleString()} ${tx.paidCurrency}`}
                            </p>
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-center font-mono text-xs">
                <div className="flex items-center justify-center gap-2">
                    <span className="min-w-[100px]">{tx.id}</span>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLinkDisabled} onClick={() => handleCopyToClipboard(tx.id)}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Copy Tx ID</p></TooltipContent>
                    </Tooltip>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <Badge variant={getStatusBadgeVariant(tx.status)} className="gap-1.5 cursor-pointer">
                        {getStatusIcon(tx.status)}
                        {tx.status}
                    </Badge>
                     <Popover>
                        <PopoverTrigger asChild>
                            <button className="text-muted-foreground hover:text-white">
                                <HelpCircle className="h-4 w-4"/>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="end" className="w-auto max-w-xs text-sm" alignOffset={-30} sideOffset={10}>
                             <div className="space-y-2">
                                <p className="font-bold">{new Date(tx.date).toLocaleString()}</p>
                                <div className="flex items-center gap-2">
                                    <p className="truncate">Tx: {tx.id}</p>
                                    {!isLinkDisabled && (
                                        <a href={`https://solscan.io/tx/${tx.id}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4"/>
                                        </a>
                                    )}
                                </div>
                                {tx.failureReason && (
                                    <p className={cn("max-w-xs break-words text-red-400")}>
                                        Reason: {tx.failureReason}
                                    </p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </TableCell>
        </TableRow>
    )
}

function TransactionMobileCard({ tx }: { tx: Transaction }) {
    const { toast } = useToast();

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "Transaction ID copied to clipboard.",
            variant: "success",
        });
    };
    const isLinkDisabled = tx.id.startsWith('tx_');

    return (
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
                <div className="font-medium text-white">
                    <p>
                        {`${tx.status === 'Completed' ? 'Purchased' : 'Attempted'} ${tx.amountExn.toLocaleString()} EXN`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {`Paid ${tx.paidAmount.toLocaleString()} ${tx.paidCurrency}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(tx.status)} className="gap-1.5 cursor-pointer">
                        {getStatusIcon(tx.status)}
                        {tx.status}
                    </Badge>
                </div>
            </div>
             <div className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                <span className="font-sans">ID:</span>
                <span className="break-all flex-1">{tx.id}</span>
                {!isLinkDisabled && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopyToClipboard(tx.id)}>
                        <Copy className="h-3 w-3" />
                    </Button>
                )}
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xs">
                <p className="text-muted-foreground">{new Date(tx.date).toLocaleString()}</p>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7" asChild disabled={isLinkDisabled}>
                        <a href={`https://solscan.io/tx/${tx.id}`} target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="mr-1.5 h-3 w-3" /> Solscan
                        </a>
                    </Button>
                 </div>
            </div>
             {tx.failureReason && (
                <p className={cn("text-xs break-words pt-1 text-red-400")}>
                    <span className="font-semibold">Reason:</span> {tx.failureReason}
                </p>
            )}
        </div>
    )
}

export function TransactionHistoryTable() {
    const { transactions } = useDashboard();
    const isMobile = useIsMobile();
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);
    const paginatedTransactions = transactions.slice(
        (currentPage - 1) * TRANSACTIONS_PER_PAGE,
        currentPage * TRANSACTIONS_PER_PAGE
    );
    
    return (
        <div className="w-full rounded-lg border border-border p-6 space-y-4 flex flex-col">
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-primary/20 rounded-md">
                        <List className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Transaction History</CardTitle>
                </div>
                <CardDescription>
                    Your recent presale contributions.
                </CardDescription>
            </div>
            <div className="pt-4 flex-grow">
                <ScrollArea className="h-[400px] w-full">
                   {transactions.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            You have no transactions yet.
                        </div>
                   ) : isMobile ? (
                       <div className="space-y-4 pr-4">
                           {paginatedTransactions.map((tx) => (
                               <TransactionMobileCard tx={tx} key={tx.id} />
                           ))}
                       </div>
                   ) : (
                    <TooltipProvider>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-center">Transaction ID</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedTransactions.map((tx) => (
                                   <TransactionRow tx={tx} key={tx.id} />
                                ))}
                            </TableBody>
                        </Table>
                    </TooltipProvider>
                   )}
                </ScrollArea>
            </div>
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
        </div>
    );
}
