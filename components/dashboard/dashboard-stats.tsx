"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Receipt, Calculator } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/animated-components";
import { motion } from "framer-motion";

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
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
    },
    {
      label: "Total Income",
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
    },
    {
      label: "Transactions",
      value: transactionCount.toLocaleString(),
      icon: Receipt,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
    },
    {
      label: "Avg Transaction",
      value: formatCurrency(avgTransaction),
      icon: Calculator,
      color: "text-foreground",
      bgColor: "bg-primary",
      borderColor: "border-foreground/20",
    },
  ];

  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StaggerItem key={stat.label}>
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 ${stat.bgColor} ${stat.borderColor}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: index * 0.1 + 0.3,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <motion.p
                      className="text-2xl font-bold text-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.4 }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
