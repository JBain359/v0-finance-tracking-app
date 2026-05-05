'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Transaction, Category } from '@/lib/types'

interface TransactionsTableProps {
  transactions: Transaction[]
  categories: Category[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount))
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function TransactionsTable({ transactions, categories }: TransactionsTableProps) {
  const router = useRouter()
  const categoryMap = new Map(categories.map(c => [c.name, c]))
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleCategoryChange = async (transactionId: string, newCategory: string) => {
    setUpdatingId(transactionId)
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update category:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-60 items-center justify-center">
          <p className="text-muted-foreground">No transactions found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[120px] text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const category = categoryMap.get(transaction.category || 'Other')
              const isCredit = transaction.transaction_type === 'credit'

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-1">
                        {transaction.merchant || transaction.description}
                      </p>
                      {transaction.merchant && transaction.merchant !== transaction.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.category || 'Other'}
                      onValueChange={(value) => handleCategoryChange(transaction.id, value)}
                      disabled={updatingId === transaction.id}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: category?.color || '#71717a' }}
                          />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: cat.color || '#71717a' }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isCredit ? 'default' : 'secondary'} className="text-xs">
                      {isCredit ? 'Income' : 'Expense'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${isCredit ? 'text-emerald-600' : ''}`}>
                    {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
