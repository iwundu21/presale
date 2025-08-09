
"use client";

import { useState } from "react";
import { History, CheckCircle2, ExternalLink, XCircle, AlertCircle, ChevronLeft, ChevronRight, HelpCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link";
import { useDashboard } from "./dashboard-client-provider";
import type { Transaction } from "./dashboard-client-provider";

const StatusBadge = ({ status }: { status: Transaction["status"] }) => {
  switch (status) {
    case "Completed":
      return (
        <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">
          <AlertCircle className="mr-1 h-3 w-3 animate-pulse" />
          {status}
        </Badge>
      );
    case "Failed":
      return (
        <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10">
          <XCircle className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};


export function TransactionHistoryTable() {
  const { transactions, handlePurchase, isLoadingPurchase } = useDashboard();
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const isTransactionRecentAndPending = (tx: Transaction) => {
    if (tx.status !== 'Pending') return false;
    const twoMinutes = 2 * 60 * 1000;
    return new Date().getTime() - new Date(tx.date).getTime() < twoMinutes;
  };

  const getTooltipContent = (tx: Transaction) => {
    const canRetry = isTransactionRecentAndPending(tx);
    if (canRetry) {
        return "Retry this pending transaction. A wallet prompt will appear.";
    }
    switch (tx.status) {
      case 'Pending':
        return "Transaction is processing. If it persists, it will be marked as failed after 2 minutes.";
      case 'Failed':
        return tx.failureReason || "Transaction failed. View on Solscan for details if a transaction ID is available.";
      case 'Completed':
        return "View completed transaction details on Solscan.";
       default:
        return "View transaction details on Solscan.";
    }
  }

  return (
    <Card className="shadow-lg border-white/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-accent" />
          <CardTitle className="text-2xl font-bold text-white">Transaction History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={100}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Value</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-center">Info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransactions.length > 0 ? (
                currentTransactions.map((tx) => {
                  const canRetry = isTransactionRecentAndPending(tx);
                  const isRetryingCurrent = isLoadingPurchase && canRetry;
                  const hasValidTxId = tx.id && !tx.id.startsWith('tx_');

                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="font-medium text-white">
                          {tx.amountExn.toLocaleString()} EXN
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {tx.paidAmount.toLocaleString()} {tx.paidCurrency}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{new Date(tx.date).toLocaleDateString()}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{new Date(tx.date).toLocaleString()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell className="text-center">
                         <Tooltip>
                          <TooltipTrigger asChild>
                              <span>
                                {canRetry ? (
                                   <Button 
                                      variant="ghost" 
                                      size="icon"
                                      disabled={isRetryingCurrent}
                                      onClick={() => handlePurchase(tx.amountExn, tx.paidAmount, tx.paidCurrency, tx.id)}
                                      className="cursor-pointer"
                                   >
                                        {isRetryingCurrent 
                                          ? <RefreshCw className="h-4 w-4 text-accent animate-spin" />
                                          : <RefreshCw className="h-4 w-4 text-accent" />
                                        }
                                    </Button>
                                ) : hasValidTxId ? (
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`https://solscan.io/tx/${tx.id}?cluster=mainnet`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 text-accent" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Transaction Details</AlertDialogTitle>
                                        </AlertDialogHeader>
                                        {tx.failureReason ? (
                                          <div className="text-sm">
                                            <p className="mb-2 text-muted-foreground">This transaction failed with the following error:</p>
                                            <div className="text-red-400 bg-red-500/10 p-2 rounded-md text-xs">{tx.failureReason}</div>
                                          </div>
                                        ) : (
                                          <AlertDialogDescription>
                                            This transaction did not generate an on-chain signature. This can happen if it was cancelled, timed out, or failed before being sent to the network.
                                          </AlertDialogDescription>
                                        )}
                                        <AlertDialogFooter>
                                          <AlertDialogAction>Close</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                )}
                              </span>
                          </TooltipTrigger>
                          <TooltipContent>
                             <p className="max-w-xs">{getTooltipContent(tx)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No transaction history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
       {totalPages > 1 && (
        <CardFooter className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
