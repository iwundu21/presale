
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, CheckCircle, AlertCircle, Clock, ExternalLink, TrendingUp, HelpCircle, RefreshCw } from "lucide-react";
import { useDashboard, Transaction } from "./dashboard-client-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "./ui/separator";

const formatTxId = (txId: string) => {
    if (txId.startsWith('tx_')) return 'Processing...';
    return `${txId.substring(0, 4)}...${txId.substring(txId.length - 4)}`;
}

const getStatusBadgeVariant = (status: Transaction['status']): BadgeProps['variant'] => {
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
        case 'Pending': return <Clock className="h-4 w-4 text-yellow-400 animate-spin" />;
    }
}

function TransactionRow({ tx }: { tx: Transaction }) {
    const { retryTransaction, isLoadingPurchase } = useDashboard();

    const isTxPendingAndRecent = (tx: Transaction) => {
        if (tx.status !== 'Pending') return false;
        const txTime = new Date(tx.date).getTime();
        const fiveMinutesAgo = new Date().getTime() - (5 * 60 * 1000);
        return txTime > fiveMinutesAgo;
    }

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
                            {`Purchased ${tx.amountExn.toLocaleString()} EXN`}
                        </p>
                         <p className="text-xs text-muted-foreground">
                            {`Paid ${tx.paidAmount.toLocaleString()} ${tx.paidCurrency}`}
                        </p>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-center">
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLinkDisabled} asChild>
                            <a href={`https://solscan.io/tx/${tx.id}`} target="_blank" rel="noopener noreferrer" >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>View on Solscan</p>
                    </TooltipContent>
                </Tooltip>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    {isTxPendingAndRecent(tx) && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    onClick={() => retryTransaction(tx)}
                                    disabled={isLoadingPurchase}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoadingPurchase ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="end">
                                <p>Retry Confirmation</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
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
                                <p>Tx: {formatTxId(tx.id)}</p>
                                {tx.status === 'Failed' && tx.failureReason && (
                                    <p className="text-red-400 max-w-xs break-words">Reason: {tx.failureReason}</p>
                                )}
                                {tx.status === 'Completed' && <p>Transaction successfully confirmed on-chain.</p>}
                                {tx.status === 'Pending' && <p>Transaction is being processed...</p>}
                                {isTxPendingAndRecent(tx) && <p>Click the refresh icon to retry confirmation.</p>}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </TableCell>
        </TableRow>
    )
}

function TransactionMobileCard({ tx }: { tx: Transaction }) {
    const { retryTransaction, isLoadingPurchase } = useDashboard();

    const isTxPendingAndRecent = (tx: Transaction) => {
        if (tx.status !== 'Pending') return false;
        const txTime = new Date(tx.date).getTime();
        const fiveMinutesAgo = new Date().getTime() - (5 * 60 * 1000);
        return txTime > fiveMinutesAgo;
    }
    const isLinkDisabled = tx.id.startsWith('tx_');

    return (
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
                <div className="font-medium text-white">
                    <p>{`Purchased ${tx.amountExn.toLocaleString()} EXN`}</p>
                    <p className="text-xs text-muted-foreground">{`Paid ${tx.paidAmount.toLocaleString()} ${tx.paidCurrency}`}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(tx.status)} className="gap-1.5 cursor-pointer">
                        {getStatusIcon(tx.status)}
                        {tx.status}
                    </Badge>
                </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xs">
                <p className="text-muted-foreground">{new Date(tx.date).toLocaleString()}</p>
                 <div className="flex items-center gap-2">
                    {isTxPendingAndRecent(tx) && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7"
                            onClick={() => retryTransaction(tx)}
                            disabled={isLoadingPurchase}
                        >
                            <RefreshCw className={`mr-1.5 h-3 w-3 ${isLoadingPurchase ? 'animate-spin' : ''}`} />
                            Retry
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-7" asChild disabled={isLinkDisabled}>
                        <a href={`https://solscan.io/tx/${tx.id}`} target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="mr-1.5 h-3 w-3" /> Solscan
                        </a>
                    </Button>
                 </div>
            </div>
             {tx.status === 'Failed' && tx.failureReason && (
                <p className="text-xs text-red-400 break-words pt-1">Reason: {tx.failureReason}</p>
            )}
        </div>
    )
}

export function TransactionHistoryTable() {
    const { transactions } = useDashboard();
    const isMobile = useIsMobile();
    
    return (
        <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-primary/20 rounded-md">
                        <List className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Transaction History</CardTitle>
                </div>
                <CardDescription>
                    Your recent presale contributions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px] w-full">
                   {transactions.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            You have no transactions yet.
                        </div>
                   ) : isMobile ? (
                       <div className="space-y-4 pr-4">
                           {transactions.map((tx) => (
                               <TransactionMobileCard tx={tx} key={tx.id} />
                           ))}
                       </div>
                   ) : (
                    <TooltipProvider>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-center">View on Chain</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                   <TransactionRow tx={tx} key={tx.id} />
                                ))}
                            </TableBody>
                        </Table>
                    </TooltipProvider>
                   )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
