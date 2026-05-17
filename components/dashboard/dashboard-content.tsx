"use client";

import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ScrollProgress } from "@/components/scroll-progress";
import { AnimatedSection, FadeInUp } from "@/components/animated-components";
import type { Transaction, Category } from "@/lib/types";

interface DashboardContentProps {
  totalSpent: number;
  totalIncome: number;
  transactionCount: number;
  avgTransaction: number;
  monthlySpending: Array<{ month: string; total: number }>;
  categorySpending: Array<{ category: string; total: number; color: string }>;
  recentTransactions: Transaction[];
  categories: Category[];
}

export function DashboardContent({
  totalSpent,
  totalIncome,
  transactionCount,
  avgTransaction,
  monthlySpending,
  categorySpending,
  recentTransactions,
  categories,
}: DashboardContentProps) {
  return (
    <>
      <ScrollProgress />
      <div className="p-6 lg:p-8" id="dashboard-start">
        <FadeInUp delay={0} className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Your financial overview at a glance
          </p>
        </FadeInUp>

        <DashboardStats
          totalSpent={totalSpent}
          totalIncome={totalIncome}
          transactionCount={transactionCount}
          avgTransaction={avgTransaction}
        />

        <AnimatedSection className="mt-8 grid gap-6 lg:grid-cols-2">
          <SpendingChart data={monthlySpending} />
          <CategoryChart data={categorySpending} />
        </AnimatedSection>

        <AnimatedSection className="mt-8" id="dashboard-end">
          <RecentTransactions
            transactions={recentTransactions}
            categories={categories}
          />
        </AnimatedSection>
      </div>
    </>
  );
}
