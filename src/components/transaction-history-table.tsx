
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, CheckCircle, AlertCircle, Clock, ExternalLink } from "lucide-react";
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
                    Your recent on-chain transactions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Date</TableHead>
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
                                            <a 
                                                href={`https://solscan.io/tx/${tx.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 font-medium text-white hover:underline"
                                            >
                                                {formatTxId(tx.id)}
                                                <ExternalLink className="h-3 w-3" />
                                             </a>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground">{tx.date.toLocaleString()}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={getStatusBadgeVariant(tx.status)} className="flex items-center gap-1.5 justify-end">
                                                {getStatusIcon(tx.status)}
                                                {tx.status}
                                            </Badge>
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
