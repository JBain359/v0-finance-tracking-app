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
    page?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

const TRANSACTIONS_PER_PAGE = 25;

async function getTransactions(
  filters: {
    search?: string;
    category?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  },
  page: number = 1,
) {
  const supabase = await createClient();

  // Determine sort column and order
  const sortBy = filters.sortBy || "date";
  const sortOrder = filters.sortOrder || "desc";
  const ascending = sortOrder === "asc";

  // RLS automatically filters by user_id from JWT
  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending });

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

  const from = (page - 1) * TRANSACTIONS_PER_PAGE;
  const to = from + TRANSACTIONS_PER_PAGE - 1;

  const { data, count } = await query.range(from, to);

  return {
    transactions: (data || []) as Transaction[],
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / TRANSACTIONS_PER_PAGE),
  };
}

async function getCategories() {
  const supabase = await createClient();
  // RLS automatically filters by user_id from JWT
  const { data } = await supabase.from("categories").select("*").order("name");

  return (data || []) as Category[];
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [transactionData, categories] = await Promise.all([
    getTransactions(params, page),
    getCategories(),
  ]);

  const { transactions, totalCount, currentPage, totalPages } = transactionData;

  // Calculate totals for current page
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
        transactionCount={totalCount}
        totalDebit={totalDebit}
        totalCredit={totalCredit}
      />

      <div className="mt-6">
        <TransactionsTable
          transactions={transactions}
          categories={categories}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          sortBy={params.sortBy || "date"}
          sortOrder={params.sortOrder || "desc"}
        />
      </div>
    </div>
  );
}
