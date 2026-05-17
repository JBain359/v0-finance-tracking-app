"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { SpendingByCategory } from "@/lib/types";

interface CategoryChartProps {
  data: SpendingByCategory[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CategoryChart({ data }: CategoryChartProps) {
  // Sort by total and take top 6
  const sortedData = [...data].sort((a, b) => b.total - a.total).slice(0, 6);

  const hasData = sortedData.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sortedData}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {sortedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Spent",
                  ]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            <p>No category data yet. Upload a statement to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
