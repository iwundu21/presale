
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, CheckCircle, AlertCircle, Clock, ExternalLink, TrendingUp, HelpCircle } from "lucide-react";
import { useDashboard, Transaction } from "./dashboard-client-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

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


export function TransactionHistoryTable() {
    const { transactions } = useDashboard();

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
                <ScrollArea className="h-[350px] pr-4">
                    <TooltipProvider>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                            You have no transactions yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
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
                                           
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a 
                                                        href={!tx.id.startsWith('tx_') ? `https://solscan.io/tx/${tx.id}` : undefined}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-end"
                                                    >
                                                        <Badge variant={getStatusBadgeVariant(tx.status)} className="gap-1.5 cursor-pointer">
                                                            {getStatusIcon(tx.status)}
                                                            {tx.status}
                                                            {!tx.id.startsWith('tx_') && <ExternalLink className="h-3 w-3" />}
                                                        </Badge>
                                                    </a>
                                                    <Tooltip delayDuration={100}>
                                                        <TooltipTrigger asChild>
                                                            <button className="text-muted-foreground hover:text-white">
                                                                <HelpCircle className="h-4 w-4"/>
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" align="end">
                                                            <p className="font-bold">{new Date(tx.date).toLocaleString()}</p>
                                                            <p>Tx: {formatTxId(tx.id)}</p>
                                                            {tx.status === 'Failed' && tx.failureReason && (
                                                                <p className="text-red-400 max-w-xs break-words">Reason: {tx.failureReason}</p>
                                                            )}
                                                            {tx.status === 'Completed' && <p>Click status to view on Solscan</p>}
                                                            {tx.status === 'Pending' && <p>Transaction is being processed...</p>}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TooltipProvider>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
