# 🚀 Quick Start Guide

## Setup Database (Choose One)

### Option 1: Automated Setup (Easiest)

```bash
cd supabase
./setup-db.sh
```

### Option 2: Supabase CLI Reset

```bash
supabase db reset
```

### Option 3: Manual (Two Commands)

```bash
supabase db execute --file migrations/000_schema.sql
supabase db execute --file migrations/001_config.sql
```

---

## Verify Setup

```bash
# Quick check - should see 6 tables
supabase db execute --sql "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
"
```

Expected output:

```
accounts
categories
merchant_categories
statements
transaction_category_overrides
transactions
```

---

## Test It Works

```sql
-- Should return without error
SELECT * FROM transactions_with_categories LIMIT 1;
```

---

## Error?

**Got a syntax error?** → See [`supabase/TROUBLESHOOTING.md`](supabase/TROUBLESHOOTING.md)

**Table already exists?** → Run `supabase db reset` to start fresh

**RLS blocking?** → Check authentication is working

---

## Next Steps

1. ✅ Database is set up
2. 📖 Read integration guide: [`SETUP_CATEGORIZATION.md`](SETUP_CATEGORIZATION.md)
3. 🔧 Add UI components to your transactions page
4. 🧪 Upload a test CSV statement
5. 🎉 Start categorizing!

---

## File Reference

| File                                                           | Purpose                |
| -------------------------------------------------------------- | ---------------------- |
| **[DATABASE_SETUP.md](DATABASE_SETUP.md)**                     | Complete setup guide   |
| **[MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)**           | Verification checklist |
| **[supabase/TROUBLESHOOTING.md](supabase/TROUBLESHOOTING.md)** | Fix common errors      |
| **[SETUP_CATEGORIZATION.md](SETUP_CATEGORIZATION.md)**         | How to use the system  |
| **[docs/CATEGORIZATION.md](docs/CATEGORIZATION.md)**           | API documentation      |

---

## One-Liner Setup

```bash
cd supabase && ./setup-db.sh && cd ..
```

That's it! 🎉
