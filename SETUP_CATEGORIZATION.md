# Merchant Categorization System - Setup Guide

## Overview

This system implements intelligent merchant categorization for financial transactions with the following features:

✅ **Merchant-level categorization** - Categorize all transactions from a merchant at once  
✅ **Transaction-specific overrides** - Override category for individual transactions  
✅ **AI-powered categorization** - Automatic categorization for unknown merchants (non-blocking)  
✅ **Keyword matching** - Fast categorization based on user-defined keywords  
✅ **Background processing** - AI categorization happens asynchronously without blocking uploads  

## What's Been Created

### Database Schema (Migrations)

1. **`003_merchant_categories.sql`**
   - `merchant_categories` table - Stores merchant → category mappings
   - `transaction_category_overrides` table - Stores transaction-specific category overrides
   - Indexes and RLS policies
   - Triggers for timestamp updates

2. **`004_transaction_category_view.sql`**
   - Database function `get_transaction_effective_category()`
   - View `transactions_with_categories` for efficient lookups
   - Handles priority: override → merchant → default

### Backend Services

3. **`lib/categorization-service.ts`**
   - `getTransactionCategory()` - Determines effective category
   - `saveMerchantCategory()` - Save merchant categorization
   - `saveTransactionOverride()` - Save transaction-specific override
   - `extractMerchant()` - Extract merchant name from description

4. **`app/api/categorize-ai/route.ts`**
   - POST endpoint for AI-powered categorization
   - Uses existing chat API with tool calling
   - Saves results to `merchant_categories` table

5. **`app/api/transactions/categorize/route.ts`**
   - POST: Update category (transaction or merchant scope)
   - GET: Retrieve effective category for a transaction

6. **Updated `app/api/process/route.ts`**
   - Now extracts merchant names during upload
   - Triggers background AI categorization for new transactions
   - Processes in batches to avoid overwhelming AI API

### Frontend Components

7. **`hooks/use-transaction-categorization.ts`**
   - React hook for category management
   - `updateCategory()` - Update with transaction/merchant scope
   - `getCategory()` - Fetch effective category
   - SWR cache invalidation

8. **`components/category-update-dialog.tsx`**
   - Dialog for updating categories
   - Radio buttons for transaction vs merchant scope
   - Shows merchant name when applying to all transactions

9. **`components/transactions/transaction-row-with-categorization.tsx`**
   - Example transaction row with edit button
   - Integrates CategoryUpdateDialog

### Types

10. **Updated `lib/types.ts`**
    - `MerchantCategory` interface
    - `TransactionCategoryOverride` interface
    - `TransactionWithCategory` interface

### Documentation

11. **`docs/CATEGORIZATION.md`**
    - Complete system documentation
    - API endpoint reference
    - Implementation examples

## Setup Instructions

### 1. Run Database Migrations

**Quick Setup (recommended):**
```bash
# Run the automated setup script
cd supabase
./setup-db.sh
```

**Manual Setup:**
```bash
# Option A: Using Supabase CLI
supabase db reset  # This will run all migrations

# Option B: Run SQL files directly in order
supabase db execute --file migrations/000_schema.sql
supabase db execute --file migrations/001_config.sql

# Option C: Using psql
psql -d your_database < migrations/000_schema.sql
psql -d your_database < migrations/001_config.sql
```

See `supabase/migrations/README.md` for detailed migration documentation.

### 2. Verify Database Setup

Check that the following tables exist:
- `merchant_categories`
- `transaction_category_overrides`

And that the view exists:
- `transactions_with_categories`

```sql
-- Test the view
SELECT * FROM transactions_with_categories LIMIT 5;
```

### 3. Update Transactions Page (Optional)

To use the new categorization dialog in your transactions table:

```tsx
// In components/transactions/transactions-table.tsx

import { TransactionRowWithCategorization } from "./transaction-row-with-categorization";

// Replace the existing transaction row rendering with:
{transactions.map((transaction) => (
  <TransactionRowWithCategorization
    key={transaction.id}
    transaction={transaction}
    categories={categories}
    categoryMap={categoryMap}
    onUpdate={() => router.refresh()}
  />
))}
```

### 4. Test the System

1. **Upload a statement** with transactions
2. **Check merchant extraction**: Transactions should have `merchant` field populated
3. **View transactions**: Should see category assignments
4. **Click edit** on a transaction category
5. **Choose scope**:
   - "This transaction only" - creates override
   - "All transactions from {merchant}" - updates merchant category
6. **Verify AI categorization**: Check `merchant_categories` table for entries with `source='ai'`

### 5. Configure AI Endpoint (If Needed)

The AI categorization uses your existing `/api/chat` endpoint. Make sure it's configured with tool calling support.

To test AI categorization manually:

```bash
curl -X POST http://localhost:3000/api/categorize-ai \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "uuid-here",
    "merchant": "Whole Foods",
    "description": "WHOLE FOODS MARKET #123",
    "userId": "user-id-here"
  }'
```

## Usage Examples

### Example 1: Update Category for One Transaction

```typescript
import { useTransactionCategorization } from '@/hooks/use-transaction-categorization';

const { updateCategory } = useTransactionCategorization();

await updateCategory({
  transactionId: "123",
  categoryName: "Groceries",
  categoryId: "cat-456",
  scope: "transaction",
});
```

### Example 2: Update Category for All Transactions from a Merchant

```typescript
await updateCategory({
  transactionId: "123",
  categoryName: "Groceries", 
  categoryId: "cat-456",
  scope: "merchant",
  merchant: "Whole Foods"
});
// This affects all transactions from "Whole Foods"
```

### Example 3: Query Transactions with Effective Categories

```typescript
const supabase = createClient();

const { data } = await supabase
  .from('transactions_with_categories')
  .select('*')
  .order('date', { ascending: false });

// Each transaction includes:
// - effective_category: The category to display
// - effective_category_id: The category UUID
// - category_source: 'override' | 'merchant' | 'default'
```

## Architecture Diagram

```
User uploads statement
        ↓
Parse & extract merchant names
        ↓
Insert transactions (merchant field populated)
        ↓
[Background] Queue AI categorization
        ↓
Display transactions
        ↓
Check categorization priority:
  1. Transaction override?
  2. Merchant category?
  3. Keyword match?
  4. Queue AI (if not done)
  5. "Uncategorized"
```

## Troubleshooting

### AI Categorization Not Working

1. Check that `/api/chat` endpoint is working
2. Verify `NEXT_PUBLIC_BASE_URL` environment variable
3. Check browser console for errors
4. Look at `merchant_categories` table for `source='ai'` entries

### Categories Not Updating

1. Verify RLS policies are set up correctly
2. Check that user is authenticated
3. Ensure `user_id` matches between tables
4. Check for errors in browser console

### Performance Issues

1. Verify indexes are created (check migration 003)
2. Use the `transactions_with_categories` view for queries
3. Consider adding pagination if showing many transactions

## Next Steps

1. ✅ Database schema is ready
2. ✅ API endpoints are implemented
3. ✅ Frontend hooks and components are available
4. ⏳ Integrate into your transactions page
5. ⏳ Test with real data
6. ⏳ Monitor AI categorization accuracy
7. ⏳ Consider adding bulk categorization UI

## Support

For questions or issues, refer to:
- `docs/CATEGORIZATION.md` - Detailed technical documentation
- Database migrations in `supabase/migrations/`
- Example components in `components/transactions/`
