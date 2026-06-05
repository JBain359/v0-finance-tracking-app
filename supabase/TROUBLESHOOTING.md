# Database Migration Troubleshooting

## Quick Fix for Common Errors

### "Syntax error at or near 'NOT'" with ALTER TABLE ADD CONSTRAINT

**Error:**
```
ERROR: 42601: syntax error at or near "NOT"
LINE 11: ALTER TABLE statements ADD CONSTRAINT IF NOT EXISTS unique_user_file_hash
```

**Cause:** PostgreSQL doesn't support `IF NOT EXISTS` with `ALTER TABLE ADD CONSTRAINT`

**Fixed in:** `001_config.sql` (uses DO block instead)

**To verify fix:**
```bash
grep -A 5 "CONSTRAINT" supabase/migrations/001_config.sql
```

Should show:
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_file_hash'
  ) THEN
    ALTER TABLE statements ADD CONSTRAINT unique_user_file_hash
      UNIQUE (user_id, file_hash, source_type);
  END IF;
END $$;
```

---

## Common Setup Issues

### 1. Migration Fails with "relation already exists"

**Error:**
```
ERROR: relation "transactions" already exists
```

**Cause:** Tables already exist in your database

**Solution A - Fresh Start (⚠️ Deletes all data):**
```bash
supabase db reset
```

**Solution B - Manual cleanup:**
```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS transaction_category_overrides CASCADE;
DROP TABLE IF EXISTS merchant_categories CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS statements CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Then run migrations
```

**Solution C - Skip schema, run config only:**
```bash
# If tables exist but just need configuration
supabase db execute --file migrations/001_config.sql
```

---

### 2. RLS Policy Blocks All Queries

**Error:**
```
Row level security policy violation
```

**Cause:** Not authenticated or wrong user_id in JWT

**Debug:**
```sql
-- Check current JWT
SELECT auth.jwt() ->> 'sub' AS user_id;

-- Temporarily disable RLS for testing (dev only!)
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Check what user_id exists in data
SELECT DISTINCT user_id FROM transactions;
```

**Fix:**
- Ensure Descope authentication is working
- Verify JWT contains 'sub' claim
- Check user_id in tables matches JWT sub

---

### 3. Supabase CLI Not Found

**Error:**
```
supabase: command not found
```

**Install:**
```bash
# macOS
brew install supabase/tap/supabase

# Linux/WSL
brew install supabase/tap/supabase
# or
npm install -g supabase

# Verify
supabase --version
```

---

### 4. Database Not Linked

**Error:**
```
Error: Project not linked
```

**Fix:**
```bash
# Link to existing project
supabase link --project-ref your-project-ref

# Or start local instance
supabase start

# Verify
supabase status
```

---

### 5. Function or View Already Exists

**Error:**
```
ERROR: function "get_transaction_effective_category" already exists
```

**Solution:**
```sql
-- Drop and recreate (safe with OR REPLACE in migration)
DROP FUNCTION IF EXISTS get_transaction_effective_category CASCADE;
DROP VIEW IF EXISTS transactions_with_categories;

-- Then rerun 000_schema.sql
```

---

### 6. Index Already Exists

**Error:**
```
ERROR: relation "transactions_user_id_idx" already exists
```

**Cause:** Indexes from previous migration

**Solution:** Migrations use `CREATE INDEX IF NOT EXISTS`, so this shouldn't happen. If it does:
```sql
-- Check existing indexes
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Drop specific index if needed
DROP INDEX IF EXISTS transactions_user_id_idx;
```

---

### 7. Permission Denied on Tables

**Error:**
```
ERROR: permission denied for table transactions
```

**Check:**
```sql
-- See table owner
SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';

-- See current user
SELECT current_user;

-- Grant permissions if needed
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
```

---

## Validation Tools

### Check Migration File Syntax

Before running migrations:
```bash
cd supabase
./validate-sql.sh
```

### Verify Database State

After running migrations:
```bash
# Check tables
psql -d your_db -c "\dt"

# Check functions
psql -d your_db -c "\df"

# Check views
psql -d your_db -c "\dv"

# Count everything
psql -d your_db -c "
SELECT
  'Tables' as type, COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'Views', COUNT(*)
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 'Functions', COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public';
"
```

### Test Core Functionality

```sql
-- Test category lookup function
SELECT * FROM get_transaction_effective_category(
  NULL::UUID, 'test-user', 'Test Merchant', 'Default Category'
);

-- Test view
SELECT COUNT(*) FROM transactions_with_categories;

-- Test RLS
SET LOCAL jwt.claims.sub = 'test-user';
SELECT COUNT(*) FROM transactions;
```

---

## Manual Migration Steps

If automated script fails, run manually:

### Step 1: Create Schema
```bash
supabase db execute --file migrations/000_schema.sql
```

**Check for errors:**
- "already exists" → OK, skip and continue
- Syntax errors → Check file, fix, retry

### Step 2: Apply Configuration
```bash
supabase db execute --file migrations/001_config.sql
```

**Check for errors:**
- "already exists" → OK, skip and continue
- Policy violations → Check RLS settings

### Step 3: Verify
```bash
# Run verification queries from MIGRATION_CHECKLIST.md
```

---

## Getting Help

### Useful Commands

```bash
# See what migrations have been applied
supabase db dump

# See current schema
supabase db diff

# Reset and start over
supabase db reset

# Check logs
supabase start
docker logs supabase_db_your_project
```

### SQL Debugging

```sql
-- Enable verbose error messages
\set VERBOSITY verbose

-- Show line numbers in psql
\set ON_ERROR_ROLLBACK interactive
\set PROMPT1 '%n@%/:%> '

-- See all tables and relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
```

---

## Still Stuck?

1. Check `DATABASE_SETUP.md` for setup instructions
2. Review `MIGRATION_CHECKLIST.md` for verification steps
3. Check `supabase/migrations/README.md` for migration details
4. Look at error message line numbers in SQL files
5. Test SQL snippets in Supabase SQL Editor (GUI)

### Create an Issue

Include:
- Error message (full text)
- Which migration file (000 or 001)
- Line number from error
- Output of `supabase status`
- PostgreSQL version: `SELECT version();`
