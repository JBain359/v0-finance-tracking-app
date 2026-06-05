# Transaction Categorization System

This document describes the transaction categorization system, including how merchants are tracked, how categories are assigned, and how users can customize categorizations.

## Overview

The categorization system uses a multi-tier approach to assign categories to transactions:

1. **Transaction-specific overrides** (highest priority)
2. **Merchant-level categories**
3. **Keyword matching**
4. **AI categorization** (fallback for unknown merchants)
5. **Default/Uncategorized** (lowest priority)

## Database Schema

### `merchant_categories`

Stores merchant-to-category mappings for each user.

```sql
CREATE TABLE merchant_categories (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  merchant TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  category_name TEXT NOT NULL,
  source TEXT NOT NULL, -- 'user', 'ai', 'keyword'
  confidence FLOAT, -- AI confidence score (0-1)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, merchant)
);
```

### `transaction_category_overrides`

Stores transaction-specific category overrides that take precedence over merchant categories.

```sql
CREATE TABLE transaction_category_overrides (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  user_id TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  category_name TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(transaction_id)
);
```

## Categorization Flow

### 1. Transaction Upload

When a user uploads a statement:

1. Transactions are parsed from the CSV/PDF
2. Merchant names are extracted using `extractMerchant()` function
3. Transactions are inserted with `merchant` field populated
4. Background categorization is triggered (non-blocking)

### 2. Category Lookup

When displaying transactions, the effective category is determined by:

```typescript
// Priority order:
1. Check transaction_category_overrides table
2. Check merchant_categories table
3. Try keyword matching against user's categories
4. Queue AI categorization (async)
5. Return "Uncategorized"
```

This is implemented in:

- `lib/categorization-service.ts` - `getTransactionCategory()`
- `supabase/migrations/004_transaction_category_view.sql` - Database view

### 3. AI Categorization (Background)

For transactions with unknown merchants:

1. During statement upload, unique merchants are extracted
2. AI categorizes each merchant (Claude Sonnet 4 via Vercel AI SDK)
3. Categorization happens in batches (5 merchants at a time) to avoid rate limits
4. Results are saved to `merchant_categories` with `source='ai'`
5. Future transactions from same merchant use this category automatically

**Note:** AI categorization runs in the background during `/api/process` and doesn't block the upload response.

### 4. User Categorization

Users can update categories in two ways:

#### Option A: Transaction-specific

- Apply to **this transaction only**
- Creates/updates record in `transaction_category_overrides`
- Other transactions from same merchant are unaffected

#### Option B: Merchant-level

- Apply to **all transactions from this merchant**
- Creates/updates record in `merchant_categories` with `source='user'`
- Removes any transaction-specific override for this transaction
- All past and future transactions from merchant use this category

## API Endpoints

### POST `/api/transactions/categorize`

Update category for a transaction.

**Request:**

```json
{
  "transactionId": "uuid",
  "categoryName": "Groceries",
  "categoryId": "uuid",
  "scope": "transaction" | "merchant",
  "merchant": "Whole Foods" // required if scope is "merchant"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Category updated",
  "affectedCount": 15 // only for merchant scope
}
```

### GET `/api/transactions/categorize?transactionId=uuid`

Get effective category for a transaction.

**Response:**

```json
{
  "category_name": "Groceries",
  "category_id": "uuid",
  "source": "merchant", // "override" | "merchant" | "ai" | "keyword" | "default"
  "confidence": 0.95 // only for AI-suggested
}
```

### POST `/api/process`

Process uploaded statement and trigger AI categorization.

**AI Categorization:**

- Automatically runs in background after transactions are inserted
- Categorizes unique merchants only (not every transaction)
- Uses Claude Haiku 4 via Vercel AI SDK (fast & cost-effective)
- Batches 5 merchants at a time with 1s delays
- Skips merchants that already have categories

## React Hooks & Components

### `useTransactionCategorization()`

Custom hook for managing categorization.

```tsx
import { useTransactionCategorization } from "@/hooks/use-transaction-categorization";

function MyComponent() {
  const { updateCategory, getCategory, isUpdating, error } =
    useTransactionCategorization();

  const handleUpdate = async () => {
    await updateCategory({
      transactionId: "uuid",
      categoryName: "Groceries",
      categoryId: "uuid",
      scope: "merchant",
      merchant: "Whole Foods",
    });
  };
}
```

### `CategoryUpdateDialog`

Dialog component for category updates with transaction/merchant scope selection.

```tsx
import { CategoryUpdateDialog } from "@/components/category-update-dialog";

<CategoryUpdateDialog
  transaction={transaction}
  categories={categories}
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => {
    // Refresh transaction list
  }}
/>;
```

## Implementation Guide

### To use categorization in a transaction list:

1. Query transactions using the `transactions_with_categories` view:

```typescript
const { data } = await supabase
  .from("transactions_with_categories")
  .select("*")
  .order("date", { ascending: false });

// Each row includes:
// - effective_category: The category to display
// - effective_category_id: The category ID
// - category_source: Where the category came from
```

2. Or use the service function:

```typescript
import { getTransactionCategory } from "@/lib/categorization-service";

const result = await getTransactionCategory(
  transactionId,
  merchant,
  description,
  userId,
  supabase,
);

console.log(result.category_name); // "Groceries"
console.log(result.source); // "merchant"
```

### To add category update UI:

```tsx
import { CategoryUpdateDialog } from "@/components/category-update-dialog";

function TransactionRow({ transaction, categories }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>Change Category</button>

      <CategoryUpdateDialog
        transaction={transaction}
        categories={categories}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          // Refresh data
        }}
      />
    </>
  );
}
```

## Performance Considerations

1. **Batch AI categorization**: Background categorization processes in batches of 10 with 1s delays
2. **Database view**: Use `transactions_with_categories` view for efficient category lookups
3. **Caching**: SWR automatically caches category lookups on the frontend
4. **Indexes**: All lookup tables have appropriate indexes on `user_id` and `merchant`

## Future Enhancements

- [ ] Bulk categorization (select multiple transactions)
- [ ] Category suggestions based on similar transactions
- [ ] Learning from user corrections to improve AI accuracy
- [ ] Export/import merchant category mappings
- [ ] Category rules (e.g., "if amount > $100 and merchant contains 'Hotel', categorize as Travel")
