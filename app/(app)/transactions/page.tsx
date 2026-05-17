import { createClient } from "@/lib/supabase/server";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionsFilters } from "@/components/transactions/transactions-filters";
import type { Transaction, Category } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

async function getTransactions(filters: {
  search?: string;
  category?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (filters.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,merchant.ilike.%${filters.search}%`,
    );
  }

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters.type && filters.type !== "all") {
    query = query.eq("transaction_type", filters.type);
  }

  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }

  const { data } = await query.limit(500);

  return (data || []) as Transaction[];
}

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");

  return (data || []) as Category[];
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [transactions, categories] = await Promise.all([
    getTransactions(params),
    getCategories(),
  ]);

  // Calculate totals
  const totalDebit = transactions
    .filter((t) => t.transaction_type === "debit")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const totalCredit = transactions
    .filter((t) => t.transaction_type === "credit")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-muted-foreground">
          View and filter all your transactions
        </p>
      </div>

      <TransactionsFilters
        categories={categories}
        currentFilters={params}
        transactionCount={transactions.length}
        totalDebit={totalDebit}
        totalCredit={totalCredit}
      />

      <div className="mt-6">
        <TransactionsTable
          transactions={transactions}
          categories={categories}
        />
      </div>
    </div>
  );
}
