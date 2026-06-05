# Database Migration Summary

## File Organization

The database schema has been consolidated into **2 main files** for easy setup:

### 📄 `000_schema.sql` (Run First)

**Purpose:** Creates all database objects  
**Contains:**

- ✓ Table definitions (6 tables)
- ✓ Functions (3 functions)
- ✓ Views (1 view)

**Tables:**

1. `accounts` - User bank/credit card accounts
2. `categories` - Transaction categories
3. `statements` - Uploaded statement files
4. `transactions` - Transaction records
5. `merchant_categories` - Merchant categorization mappings
6. `transaction_category_overrides` - Transaction-specific overrides

**Functions:**

- `update_updated_at_column()` - Auto-update timestamps
- `get_transaction_effective_category()` - Category lookup with priority
- `execute_query()` - Safe free-form SELECT queries

**Views:**

- `transactions_with_categories` - Transactions with effective categories

---

### 📄 `001_config.sql` (Run Second)

**Purpose:** Configures security, performance, and constraints  
**Contains:**

- ✓ Constraints (1 unique constraint)
- ✓ Indexes (13 indexes)
- ✓ Triggers (3 auto-update triggers)
- ✓ Row Level Security (RLS) policies (24 policies)
- ✓ Permissions/Grants

**Indexes on:**

- `transactions` (4 indexes)
- `statements` (3 indexes)
- `categories` (2 indexes)
- `accounts` (1 index)
- `merchant_categories` (3 indexes)
- `transaction_category_overrides` (2 indexes)

**RLS Policies:** 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

---

## Quick Start

### Automated Setup

```bash
cd supabase
./setup-db.sh
```

### Manual Setup

```bash
# Run in order:
supabase db execute --file migrations/000_schema.sql
supabase db execute --file migrations/001_config.sql
```

---

## Old Migration Files

The following legacy files are **no longer needed** (their contents are now in `000_schema.sql` and `001_config.sql`):

| Old File                            | Now Located In   | Can Delete?                |
| ----------------------------------- | ---------------- | -------------------------- |
| `001_add_rls.sql`                   | `001_config.sql` | ✅ Yes (if starting fresh) |
| `002_free_query.sql`                | `000_schema.sql` | ✅ Yes (if starting fresh) |
| `003_merchant_categories.sql`       | Both files       | ✅ Yes (if starting fresh) |
| `004_transaction_category_view.sql` | `000_schema.sql` | ✅ Yes (if starting fresh) |

**Note:** If you have an existing database with migrations already applied, keep these files for now. The new files are designed for fresh setups or complete resets.

---

## Migration Strategy

### For New Projects (Fresh Database)

1. Delete old migration files (001-004)
2. Run `000_schema.sql`
3. Run `001_config.sql`
4. Done! ✅

### For Existing Projects (Already Have Data)

**Option A: Reset Everything (⚠️ Deletes all data)**

```bash
supabase db reset
```

**Option B: Keep Existing Data (Manual)**

1. Review what's already in your database
2. Extract any new table definitions from `000_schema.sql`
3. Apply only the new parts
4. Apply any missing configs from `001_config.sql`

---

## Verification Checklist

After running migrations, verify:

- [ ] 6 tables created
- [ ] 1 view created (`transactions_with_categories`)
- [ ] 3 functions created
- [ ] 13+ indexes created
- [ ] RLS enabled on all tables
- [ ] 24 RLS policies created (4 per table)
- [ ] 3 triggers created

### Quick Verification Commands

```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 6

-- Check RLS is enabled
SELECT COUNT(*) FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: 6

-- Count indexes
SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
-- Expected: 13+

-- Count policies
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Expected: 24
```

---

## Troubleshooting

### "Table already exists" error

You're running on a database with existing tables. Either:

1. Use `supabase db reset` to start fresh (⚠️ deletes data)
2. Manually apply only new tables/features

### RLS blocking queries

Check authentication context. RLS requires proper JWT from Descope:

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Indexes not being used

Check query plans:

```sql
EXPLAIN ANALYZE SELECT * FROM transactions WHERE user_id = 'test';
```

---

## Next Steps

1. ✅ Run `000_schema.sql`
2. ✅ Run `001_config.sql`
3. ✅ Verify setup (see checklist above)
4. 📖 Read `docs/CATEGORIZATION.md` for API usage
5. 🔧 Integrate frontend components
6. 🧪 Test with sample data

For detailed categorization system documentation, see:

- `docs/CATEGORIZATION.md` - Technical documentation
- `SETUP_CATEGORIZATION.md` - Integration guide
