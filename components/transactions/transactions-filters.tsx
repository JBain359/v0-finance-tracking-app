'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, TrendingDown, TrendingUp, Receipt } from 'lucide-react'
import type { Category } from '@/lib/types'

interface TransactionsFiltersProps {
  categories: Category[]
  currentFilters: {
    search?: string
    category?: string
    type?: string
    startDate?: string
    endDate?: string
  }
  transactionCount: number
  totalDebit: number
  totalCredit: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function TransactionsFilters({
  categories,
  currentFilters,
  transactionCount,
  totalDebit,
  totalCredit,
}: TransactionsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentFilters.search || '')

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/transactions?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = () => {
    updateFilters('search', search || null)
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/transactions')
  }

  const hasFilters = currentFilters.search || currentFilters.category || currentFilters.type || currentFilters.startDate || currentFilters.endDate

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Showing</p>
              <p className="text-lg font-semibold">{transactionCount} transactions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-lg font-semibold">{formatCurrency(totalDebit)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-lg font-semibold">{formatCurrency(totalCredit)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Search
              </Button>
            </div>

            <Select
              value={currentFilters.category || 'all'}
              onValueChange={(value) => updateFilters('category', value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentFilters.type || 'all'}
              onValueChange={(value) => updateFilters('type', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="debit">Expenses</SelectItem>
                <SelectItem value="credit">Income</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={currentFilters.startDate || ''}
              onChange={(e) => updateFilters('startDate', e.target.value || null)}
              className="w-[150px]"
              placeholder="Start Date"
            />

            <Input
              type="date"
              value={currentFilters.endDate || ''}
              onChange={(e) => updateFilters('endDate', e.target.value || null)}
              className="w-[150px]"
              placeholder="End Date"
            />

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
