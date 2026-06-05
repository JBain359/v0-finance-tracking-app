# Database Migrations

## Quick Setup

Run these two files in order:

### 1. Schema (Tables, Functions, Views)
```bash
psql -d your_database < 000_schema.sql
```
or with Supabase CLI:
```bash
supabase db execute --file 000_schema.sql
```

### 2. Configuration (Indexes, RLS, Triggers)
```bash
psql -d your_database < 001_config.sql
```
or with Supabase CLI:
```bash
supabase db execute --file 001_config.sql
```

## Alternative: Use Supabase CLI Migration System

If you're using Supabase CLI's migration system:

```bash
# Reset the database and apply all migrations
supabase db reset

# Or push migrations to remote
supabase db push
```

## What's in Each File

### `000_schema.sql` (Run First)
- All table definitions
- Database functions
- Views
- Core schema structure

**Tables created:**
- `accounts` - User bank/credit card accounts
- `categories` - Transaction categories with keywords
- `statements` - Uploaded statement files
- `transactions` - Individual transaction records
- `merchant_categories` - Merchant → category mappings
- `transaction_category_overrides` - Transaction-specific category overrides

### `001_config.sql` (Run Second)
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates
- Constraints
- Permissions

## Legacy Migration Files

The following files have been **archived** in `legacy_backup/` folder:
- ~~`001_add_rls.sql`~~ → Now in `001_config.sql`
- ~~`002_free_query.sql`~~ → Now in `000_schema.sql`
- ~~`003_merchant_categories.sql`~~ → Now split between `000_schema.sql` and `001_config.sql`
- ~~`004_transaction_category_view.sql`~~ → Now in `000_schema.sql`

**These files are no longer used.** They're kept in `legacy_backup/` for reference only.

## Verification

After running both migrations, verify the setup:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should see:
-- accounts
-- categories
-- merchant_categories
-- statements
-- transaction_category_overrides
-- transactions
-- transactions_with_categories (view)

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## Testing

```sql
-- Test the effective category function
SELECT * FROM get_transaction_effective_category(
  'some-transaction-uuid'::UUID,
  'user-id',
  'Whole Foods',
  'Groceries'
);

-- Test the view
SELECT * FROM transactions_with_categories LIMIT 5;

-- Test the free query function (requires authentication context)
SELECT execute_query('SELECT COUNT(*) as total FROM transactions');
```

## Troubleshooting

### "relation already exists" errors
If tables already exist from previous migrations:
```sql
-- Option 1: Drop all tables (⚠️ deletes all data)
DROP TABLE IF EXISTS transaction_category_overrides CASCADE;
DROP TABLE IF EXISTS merchant_categories CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS statements CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Then re-run 000_schema.sql and 001_config.sql
```

### RLS blocking queries
Make sure you're authenticated with proper JWT:
```sql
-- Temporarily disable RLS for testing (dev only!)
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

### Check policy definitions
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
