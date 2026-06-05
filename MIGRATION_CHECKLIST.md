# 📋 Migration Checklist

Use this checklist to migrate your database to the new consolidated schema.

## Pre-Migration

- [ ] **Backup existing data** (if you have any)
  ```bash
  # If using Supabase
  supabase db dump > backup_$(date +%Y%m%d).sql
  
  # Or with pg_dump
  pg_dump your_database > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Check current state**
  ```sql
  -- See what tables exist
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```

- [ ] **Review migration files**
  - Read `supabase/migrations/000_schema.sql`
  - Read `supabase/migrations/001_config.sql`
  - Read `supabase/MIGRATION_SUMMARY.md`

## Migration Steps

### Option A: Fresh Start (Recommended for New Projects)

- [ ] **Run automated setup**
  ```bash
  cd supabase
  ./setup-db.sh
  ```

- [ ] **Or run manually**
  ```bash
  supabase db execute --file migrations/000_schema.sql
  supabase db execute --file migrations/001_config.sql
  ```

### Option B: Existing Database with Data

- [ ] **Reset database** (⚠️ Deletes all data)
  ```bash
  supabase db reset
  ```

- [ ] **Restore data from backup** (if needed)
  ```bash
  psql your_database < backup_YYYYMMDD.sql
  ```

## Post-Migration Verification

### Check Tables

- [ ] **6 tables exist**
  ```sql
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  -- Expected: 6
  ```

- [ ] **Specific tables exist**
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name;
  ```
  Expected tables:
  - [ ] `accounts`
  - [ ] `categories`
  - [ ] `merchant_categories` ← NEW
  - [ ] `statements`
  - [ ] `transaction_category_overrides` ← NEW
  - [ ] `transactions`

### Check Functions

- [ ] **3 functions exist**
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
  ```
  Expected functions:
  - [ ] `execute_query`
  - [ ] `get_transaction_effective_category` ← NEW
  - [ ] `update_updated_at_column`

### Check Views

- [ ] **View exists**
  ```sql
  SELECT table_name FROM information_schema.views
  WHERE table_schema = 'public';
  ```
  Expected view:
  - [ ] `transactions_with_categories` ← NEW

### Check RLS (Row Level Security)

- [ ] **RLS enabled on all tables**
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
  -- All should have rowsecurity = true
  ```

- [ ] **24 policies created**
  ```sql
  SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
  -- Expected: 24 (4 per table × 6 tables)
  ```

### Check Indexes

- [ ] **Indexes created**
  ```sql
  SELECT tablename, COUNT(*) as index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  GROUP BY tablename
  ORDER BY tablename;
  ```
  Expected minimum:
  - `accounts`: 1+ indexes
  - `categories`: 2+ indexes
  - `merchant_categories`: 3+ indexes
  - `statements`: 3+ indexes
  - `transaction_category_overrides`: 2+ indexes
  - `transactions`: 4+ indexes

### Check Triggers

- [ ] **3 triggers exist**
  ```sql
  SELECT trigger_name, event_object_table
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
  ```
  Expected triggers:
  - [ ] `update_accounts_updated_at`
  - [ ] `update_merchant_categories_updated_at` ← NEW
  - [ ] `update_transaction_overrides_updated_at` ← NEW

## Test Functionality

### Basic Queries

- [ ] **Query transactions**
  ```sql
  SELECT * FROM transactions LIMIT 1;
  ```

- [ ] **Query with effective categories** ← NEW
  ```sql
  SELECT
    id,
    description,
    merchant,
    effective_category,
    category_source
  FROM transactions_with_categories
  LIMIT 5;
  ```

- [ ] **Test categorization function** ← NEW
  ```sql
  -- This should return without error
  SELECT * FROM get_transaction_effective_category(
    NULL::UUID,  -- transaction_id
    'test-user',
    'Test Merchant',
    'Test Category'
  );
  ```

### Insert Test Data

- [ ] **Create test category**
  ```sql
  INSERT INTO categories (user_id, name, keywords)
  VALUES ('test-user', 'Groceries', ARRAY['grocery', 'food', 'supermarket'])
  RETURNING *;
  ```

- [ ] **Create test merchant category** ← NEW
  ```sql
  INSERT INTO merchant_categories (user_id, merchant, category_name, source)
  VALUES ('test-user', 'Whole Foods', 'Groceries', 'user')
  RETURNING *;
  ```

- [ ] **Verify RLS works**
  ```sql
  -- Should return empty (RLS blocks without proper auth)
  SET LOCAL jwt.claims.sub = 'wrong-user';
  SELECT * FROM merchant_categories WHERE user_id = 'test-user';
  ```

## Application Integration

### Backend

- [ ] **API endpoints work**
  - [ ] `POST /api/categorize-ai` ← NEW
  - [ ] `POST /api/transactions/categorize` ← NEW
  - [ ] `GET /api/transactions/categorize?transactionId=...` ← NEW
  - [ ] `POST /api/process` (updated)

- [ ] **Services function**
  - [ ] `lib/categorization-service.ts` imports work
  - [ ] `lib/types.ts` has new interfaces

### Frontend

- [ ] **Components exist**
  - [ ] `components/category-update-dialog.tsx` ← NEW
  - [ ] `components/transactions/transaction-row-with-categorization.tsx` ← NEW

- [ ] **Hooks work**
  - [ ] `hooks/use-transaction-categorization.ts` ← NEW

- [ ] **Integration**
  - [ ] Category dialog opens
  - [ ] Can select transaction vs merchant scope
  - [ ] Updates save successfully
  - [ ] UI refreshes after update

## Functional Testing

### Upload Flow

- [ ] **Upload CSV statement**
  - [ ] Parses correctly
  - [ ] Extracts merchant names
  - [ ] Creates transactions

- [ ] **Categorization happens**
  - [ ] Keyword matching works
  - [ ] AI categorization queues (check console/logs)
  - [ ] Check `merchant_categories` table for AI entries

### Update Flow

- [ ] **Transaction-specific update**
  - [ ] Opens dialog
  - [ ] Select category
  - [ ] Choose "This transaction only"
  - [ ] Saves to `transaction_category_overrides`

- [ ] **Merchant-level update**
  - [ ] Opens dialog
  - [ ] Select category
  - [ ] Choose "All transactions from {merchant}"
  - [ ] Saves to `merchant_categories`
  - [ ] Other transactions from same merchant update

### View Flow

- [ ] **Transactions display**
  - [ ] Show correct effective category
  - [ ] Indicate category source (override/merchant/default)
  - [ ] Filter by category works

## Cleanup (Optional)

- [ ] **Remove old migration files** (if starting fresh)
  ```bash
  # Only do this if you don't need the old files
  rm supabase/migrations/001_add_rls.sql
  rm supabase/migrations/002_free_query.sql
  rm supabase/migrations/003_merchant_categories.sql
  rm supabase/migrations/004_transaction_category_view.sql
  ```

- [ ] **Update documentation links**
  - Update any docs that reference old migration files

## Done! 🎉

- [ ] **Database migrated successfully**
- [ ] **All verifications passed**
- [ ] **Application working**
- [ ] **Team notified** (if applicable)

---

## Rollback Plan (If Needed)

If something goes wrong:

1. **Restore from backup**
   ```bash
   psql your_database < backup_YYYYMMDD.sql
   ```

2. **Or revert specific changes**
   ```sql
   -- Drop new tables
   DROP TABLE IF EXISTS transaction_category_overrides CASCADE;
   DROP TABLE IF EXISTS merchant_categories CASCADE;
   
   -- Drop new functions
   DROP FUNCTION IF EXISTS get_transaction_effective_category CASCADE;
   
   -- Drop new view
   DROP VIEW IF EXISTS transactions_with_categories;
   ```

3. **Contact support** or check documentation

---

## Reference

- **Setup Guide:** `DATABASE_SETUP.md`
- **Migration Details:** `supabase/MIGRATION_SUMMARY.md`
- **API Documentation:** `docs/CATEGORIZATION.md`
- **Integration Guide:** `SETUP_CATEGORIZATION.md`
