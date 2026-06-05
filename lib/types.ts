export interface Statement {
  id: string;
  user_id: string;
  filename: string;
  blob_pathname: string;
  file_type: "csv" | "pdf";
  source_type: "bank" | "credit_card";
  account_id: string | null;
  uploaded_at: string;
  processed: boolean;
  row_count: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  statement_id: string | null;
  date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit" | null;
  category: string | null;
  merchant: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  keywords: string[];
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SpendingByCategory {
  category: string;
  total: number;
  color: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
}

export interface DashboardStats {
  totalSpent: number;
  totalIncome: number;
  transactionCount: number;
  avgTransaction: number;
}

export interface MerchantCategory {
  id: string;
  user_id: string;
  merchant: string;
  category_id: string | null;
  category_name: string;
  source: "user" | "ai" | "keyword";
  confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategoryOverride {
  id: string;
  transaction_id: string;
  user_id: string;
  category_id: string | null;
  category_name: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  effective_category: string | null;
  category_source: "override" | "merchant" | "default" | null;
}
