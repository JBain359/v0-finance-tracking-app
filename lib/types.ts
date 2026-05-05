export interface Statement {
  id: string
  filename: string
  blob_pathname: string
  file_type: 'csv' | 'pdf'
  source_type: 'bank' | 'credit_card'
  uploaded_at: string
  processed: boolean
  row_count: number
}

export interface Transaction {
  id: string
  statement_id: string | null
  date: string
  description: string
  amount: number
  transaction_type: 'debit' | 'credit' | null
  category: string | null
  merchant: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  keywords: string[]
  created_at: string
}

export interface SpendingByCategory {
  category: string
  total: number
  color: string
}

export interface MonthlySpending {
  month: string
  total: number
}

export interface DashboardStats {
  totalSpent: number
  totalIncome: number
  transactionCount: number
  avgTransaction: number
}
