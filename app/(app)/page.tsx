import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { CategoryChart } from '@/components/dashboard/category-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import type { Transaction, Category } from '@/lib/types'

async function getDashboardData() {
  const supabase = await createClient()
  
  // Get transactions from the last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', sixMonthsAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
  
  return {
    transactions: (transactions || []) as Transaction[],
    categories: (categories || []) as Category[],
  }
}

export default async function DashboardPage() {
  const { transactions, categories } = await getDashboardData()
  
  // Calculate stats
  const debits = transactions.filter(t => t.transaction_type === 'debit')
  const credits = transactions.filter(t => t.transaction_type === 'credit')
  
  const totalSpent = debits.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  const totalIncome = credits.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  const transactionCount = transactions.length
  const avgTransaction = transactionCount > 0 ? totalSpent / debits.length : 0
  
  // Group spending by category
  const categoryMap = new Map(categories.map(c => [c.name, c]))
  const spendingByCategory = debits.reduce((acc, t) => {
    const cat = t.category || 'Other'
    if (!acc[cat]) {
      const category = categoryMap.get(cat)
      acc[cat] = { category: cat, total: 0, color: category?.color || '#71717a' }
    }
    acc[cat].total += Math.abs(Number(t.amount))
    return acc
  }, {} as Record<string, { category: string; total: number; color: string }>)
  
  // Group spending by month
  const monthlySpending = debits.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!acc[month]) {
      acc[month] = { month, total: 0 }
    }
    acc[month].total += Math.abs(Number(t.amount))
    return acc
  }, {} as Record<string, { month: string; total: number }>)
  
  const recentTransactions = transactions.slice(0, 10)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview at a glance</p>
      </div>
      
      <DashboardStats
        totalSpent={totalSpent}
        totalIncome={totalIncome}
        transactionCount={transactionCount}
        avgTransaction={avgTransaction}
      />
      
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SpendingChart data={Object.values(monthlySpending)} />
        <CategoryChart data={Object.values(spendingByCategory)} />
      </div>
      
      <div className="mt-8">
        <RecentTransactions transactions={recentTransactions} categories={categories} />
      </div>
    </div>
  )
}
