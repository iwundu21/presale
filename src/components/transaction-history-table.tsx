
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useDashboard, Transaction } from "./dashboard-client-provider";

const formatTxId = (txId: string) => {
    if (txId.startsWith('tx_')) return 'Pending...';
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
        case 'Pending': return <Clock className="h-4 w-4 text-yellow-400" />;
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
                    A log of your recent EXN token purchases.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Amount (EXN)</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        You have no transactions yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            <div className="font-medium text-white">{tx.amountExn.toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground">{tx.date.toLocaleDateString()}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-white">{tx.paidAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                                            <div className="text-xs text-muted-foreground">{tx.paidCurrency}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <a 
                                                href={`https://solscan.io/tx/${tx.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                <Badge variant={getStatusBadgeVariant(tx.status)} className="flex items-center gap-1.5 justify-end">
                                                    {getStatusIcon(tx.status)}
                                                    {tx.status}
                                                </Badge>
                                             </a>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
