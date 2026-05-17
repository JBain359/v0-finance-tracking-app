import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Transaction, Category } from "@/lib/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
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
  });
}

export function RecentTransactions({
  transactions,
  categories,
}: RecentTransactionsProps) {
  const categoryMap = new Map(categories.map((c) => [c.name, c]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Recent Transactions
        </CardTitle>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-sm text-foreground hover:text-foreground/80 hover:underline"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const category = categoryMap.get(transaction.category || "Other");
              const isCredit = transaction.transaction_type === "credit";

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: category?.color || "#71717a" }}
                    />
                    <div>
                      <p className="font-medium text-foreground line-clamp-1">
                        {transaction.merchant || transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                        {transaction.category && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {transaction.category}
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${isCredit ? "text-emerald-600" : "text-foreground"}`}
                  >
                    {isCredit ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <p>No transactions yet. Upload a statement to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
