"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Transaction, Category } from "@/lib/types";

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: Category[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  sortBy: string;
  sortOrder: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TransactionsTable({
  transactions,
  categories,
  currentPage,
  totalPages,
  totalCount,
  sortBy,
  sortOrder,
}: TransactionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryMap = new Map(categories.map((c) => [c.name, c]));
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/transactions?${params.toString()}`);
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // If clicking the same column, toggle order; otherwise default to desc
    if (sortBy === column) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      params.set("sortOrder", newOrder);
    } else {
      params.set("sortBy", column);
      params.set("sortOrder", "desc");
    }

    // Reset to page 1 when sorting changes
    params.delete("page");
    router.push(`/transactions?${params.toString()}`);
    router.refresh();
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => {
    const isActive = sortBy === column;
    const Icon = !isActive
      ? ArrowUpDown
      : sortOrder === "asc"
        ? ArrowUp
        : ArrowDown;

    return (
      <TableHead
        className="cursor-pointer select-none"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-2 hover:text-foreground transition-colors">
          {children}
          <Icon
            className={`h-4 w-4 ${isActive ? "text-foreground" : "text-muted-foreground"}`}
          />
        </div>
      </TableHead>
    );
  };

  const handleCategoryChange = async (
    transactionId: string,
    newCategory: string,
  ) => {
    setUpdatingId(transactionId);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update category:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-60 items-center justify-center">
          <p className="text-muted-foreground">No transactions found</p>
        </CardContent>
      </Card>
    );
  }

  const startRecord = (currentPage - 1) * 25 + 1;
  const endRecord = Math.min(currentPage * 25, totalCount);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="date">
                <span className="w-[100px]">Date</span>
              </SortableHeader>
              <TableHead>Description</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <SortableHeader column="amount">
                <span className="w-[120px] text-right block">Amount</span>
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const category = categoryMap.get(transaction.category || "Other");
              const isCredit = transaction.transaction_type === "credit";

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-1">
                        {transaction.merchant || transaction.description}
                      </p>
                      {transaction.merchant &&
                        transaction.merchant !== transaction.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {transaction.description}
                          </p>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.category || "Other"}
                      onValueChange={(value) =>
                        handleCategoryChange(transaction.id, value)
                      }
                      disabled={updatingId === transaction.id}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: category?.color || "#71717a",
                            }}
                          />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: cat.color || "#71717a",
                                }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isCredit ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {isCredit ? "Income" : "Expense"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${isCredit ? "text-emerald-600" : ""}`}
                  >
                    {isCredit ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startRecord}</span> to{" "}
            <span className="font-medium">{endRecord}</span> of{" "}
            <span className="font-medium">{totalCount}</span> transactions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
