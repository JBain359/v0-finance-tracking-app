"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { CategoryUpdateDialog } from "@/components/category-update-dialog";
import type { Transaction, Category } from "@/lib/types";

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  categoryMap: Map<string, Category>;
  onUpdate?: () => void;
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

export function TransactionRowWithCategorization({
  transaction,
  categories,
  categoryMap,
  onUpdate,
}: TransactionRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const category = categoryMap.get(transaction.category || "Other");
  const isCredit = transaction.transaction_type === "credit";

  return (
    <>
      <TableRow>
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: category?.color || "#71717a",
                }}
              />
              <span className="text-sm">
                {transaction.category || "Uncategorized"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setDialogOpen(true)}
            >
              <Pencil className="h-3 w-3" />
              <span className="sr-only">Edit category</span>
            </Button>
          </div>
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

      <CategoryUpdateDialog
        transaction={transaction}
        categories={categories}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false);
          onUpdate?.();
        }}
      />
    </>
  );
}
