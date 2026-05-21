import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { Transaction, Category } from "@/lib/types";

async function getDashboardData() {
  const supabase = await createClient();

  // Get transactions from the last 6 months
  // RLS automatically filters by user_id from JWT
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", sixMonthsAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const { data: categories } = await supabase.from("categories").select("*");

  return {
    transactions: (transactions || []) as Transaction[],
    categories: (categories || []) as Category[],
  };
}

export default async function DashboardPage() {
  const { transactions, categories } = await getDashboardData();

  // Calculate stats
  const debits = transactions.filter((t) => t.transaction_type === "debit");
  const credits = transactions.filter((t) => t.transaction_type === "credit");

  const totalSpent = debits.reduce(
    (sum, t) => sum + Math.abs(Number(t.amount)),
    0,
  );
  const totalIncome = credits.reduce(
    (sum, t) => sum + Math.abs(Number(t.amount)),
    0,
  );
  const transactionCount = transactions.length;
  const avgTransaction = transactionCount > 0 ? totalSpent / debits.length : 0;

  // Group spending by category
  const categoryMap = new Map(categories.map((c) => [c.name, c]));
  const spendingByCategory = debits.reduce(
    (acc, t) => {
      const cat = t.category || "Other";
      if (!acc[cat]) {
        const category = categoryMap.get(cat);
        acc[cat] = {
          category: cat,
          total: 0,
          color: category?.color || "#71717a",
        };
      }
      acc[cat].total += Math.abs(Number(t.amount));
      return acc;
    },
    {} as Record<string, { category: string; total: number; color: string }>,
  );

  // Group spending by month
  const monthlySpending = debits.reduce(
    (acc, t) => {
      const month = new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (!acc[month]) {
        acc[month] = { month, total: 0 };
      }
      acc[month].total += Math.abs(Number(t.amount));
      return acc;
    },
    {} as Record<string, { month: string; total: number }>,
  );

  const recentTransactions = transactions.slice(0, 10);

  return (
    <DashboardContent
      totalSpent={totalSpent}
      totalIncome={totalIncome}
      transactionCount={transactionCount}
      avgTransaction={avgTransaction}
      monthlySpending={Object.values(monthlySpending)}
      categorySpending={Object.values(spendingByCategory)}
      recentTransactions={recentTransactions}
      categories={categories}
    />
  );
}
