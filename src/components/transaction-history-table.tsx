
"use client";

import { History, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "./ui/button";
import Link from "next/link";

export type Transaction = {
  id: string;
  amountExn: number;
  paidAmount: number;
  paidCurrency: string;
  date: Date;
  status: "Completed" | "Pending" | "Failed";
};

type TransactionHistoryTableProps = {
  transactions: Transaction[];
};

export function TransactionHistoryTable({ transactions }: TransactionHistoryTableProps) {
  return (
    <Card className="shadow-lg border-white/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-accent" />
          <CardTitle className="text-2xl font-bold text-white">Transaction History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Value</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
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
                          <span>{tx.date.toLocaleDateString()}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tx.date.toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon">
                             <Link href={`https://solscan.io/tx/${tx.id}`} target="_blank">
                                <ExternalLink className="h-4 w-4 text-accent" />
                             </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View on Solscan</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Connect your wallet to see your transactions.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
