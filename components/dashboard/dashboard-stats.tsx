import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Receipt, Calculator } from "lucide-react";

interface DashboardStatsProps {
  totalSpent: number;
  totalIncome: number;
  transactionCount: number;
  avgTransaction: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function DashboardStats({
  totalSpent,
  totalIncome,
  transactionCount,
  avgTransaction,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Total Spent",
      value: formatCurrency(totalSpent),
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      label: "Total Income",
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Transactions",
      value: transactionCount.toLocaleString(),
      icon: Receipt,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "Avg Transaction",
      value: formatCurrency(avgTransaction),
      icon: Calculator,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
