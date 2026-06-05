import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { Transaction, Category } from "@/lib/types";

async function getDashboardData() {
  const supabase = await createClient();

  // Get transactions from the last 6 months with effective categories
  // RLS automatically filters by user_id from JWT
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: transactions } = await supabase
    .from("transactions_with_categories")
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

  // Group spending by category (use effective_category from the view)
  const categoryMap = new Map(categories.map((c) => [c.name, c]));

  // Generate default colors for categories that don't exist in user's categories
  const defaultColors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
  ];
  let colorIndex = 0;

  const spendingByCategory = debits.reduce(
    (acc, t) => {
      // Use effective_category from the view (falls back to transaction.category)
      const cat = (t as any).effective_category || t.category || "Uncategorized";
      if (!acc[cat]) {
        const category = categoryMap.get(cat);
        // If no user-defined category, assign a default color
        const color = category?.color || defaultColors[colorIndex++ % defaultColors.length];
        acc[cat] = {
          category: cat,
          total: 0,
          color,
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
