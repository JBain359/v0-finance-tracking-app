# 🗄️ Database Setup Guide

## TL;DR - Quick Setup

```bash
cd supabase
./setup-db.sh
```

That's it! The script will guide you through the process.

---

## What Gets Created

### 📊 Tables (6)
```
accounts
  ├── Basic account info (name, timestamps)
  └── Referenced by statements

categories
  ├── User-defined categories
  ├── Includes keywords, icons, colors
  └── Referenced by merchant_categories

statements
  ├── Uploaded CSV/PDF files
  ├── Links to blob storage
  └── Referenced by transactions

transactions
  ├── Individual transaction records
  ├── Date, amount, description, merchant
  └── Referenced by transaction_category_overrides

merchant_categories
  ├── Merchant → Category mappings
  ├── Tracks source (user/ai/keyword)
  └── Auto-categorizes future transactions

transaction_category_overrides
  └── Per-transaction category overrides
```

### 🔧 Functions (3)
- **`update_updated_at_column()`** - Auto-timestamps
- **`get_transaction_effective_category()`** - Smart category lookup
- **`execute_query()`** - Safe free-form queries

### 👁️ Views (1)
- **`transactions_with_categories`** - Transactions with effective categories computed

### 🔒 Security
- **RLS enabled** on all 6 tables
- **24 policies** (4 per table: SELECT, INSERT, UPDATE, DELETE)
- **JWT-based auth** (Descope integration)

### ⚡ Performance
- **13+ indexes** across all tables
- **3 triggers** for auto-updates

---

## File Structure

```
supabase/
├── setup-db.sh           # 👈 RUN THIS
├── MIGRATION_SUMMARY.md  # Detailed migration info
├── README.md             # Migration documentation
└── migrations/
    ├── 000_schema.sql    # 1️⃣ Run first:  Tables, Functions, Views
    ├── 001_config.sql    # 2️⃣ Run second: Indexes, RLS, Triggers
    │
    └── [legacy files - can ignore if starting fresh]
        ├── 001_add_rls.sql
        ├── 002_free_query.sql
        ├── 003_merchant_categories.sql
        └── 004_transaction_category_view.sql
```

---

## Manual Setup (Alternative)

If you prefer to run migrations manually:

### Option 1: Supabase CLI
```bash
# Automated (runs all migrations)
supabase db reset

# Or step-by-step
supabase db execute --file migrations/000_schema.sql
supabase db execute --file migrations/001_config.sql
```

### Option 2: Direct SQL
```bash
psql -d your_database -f migrations/000_schema.sql
psql -d your_database -f migrations/001_config.sql
```

### Option 3: Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `000_schema.sql` → Run
3. Copy contents of `001_config.sql` → Run

---

## Verification

After setup, check that everything worked:

```sql
-- Should return 6 tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Should return true for all 6 tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- Test the categorization function
SELECT * FROM transactions_with_categories LIMIT 1;
```

---

## What This Enables

### ✅ Core Features
- Upload bank/credit card statements (CSV/PDF)
- Parse and store transactions
- Categorize transactions
- View spending analytics

### ✨ New Merchant Categorization Features
- **Auto-categorize** transactions by merchant
- **AI-powered** categorization for unknown merchants
- **Choose scope** when updating:
  - "This transaction only"
  - "All transactions from this merchant"
- **Priority system:**
  1. Transaction-specific override (highest)
  2. Merchant-level category
  3. Keyword matching
  4. AI suggestion (background)
  5. Uncategorized (fallback)

---

## Next Steps

1. **✅ Run Setup**
   ```bash
   cd supabase && ./setup-db.sh
   ```

2. **📖 Read Docs**
   - `SETUP_CATEGORIZATION.md` - Integration guide
   - `docs/CATEGORIZATION.md` - API reference
   - `supabase/MIGRATION_SUMMARY.md` - Migration details

3. **🔧 Integrate Frontend**
   - Use `CategoryUpdateDialog` component
   - Use `useTransactionCategorization()` hook
   - Query `transactions_with_categories` view

4. **🧪 Test**
   - Upload a sample CSV statement
   - Check merchant extraction
   - Try categorizing transactions
   - Verify AI categorization (check `merchant_categories` table)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  User uploads statement (CSV/PDF)                       │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│  Parse & extract merchant names                         │
│  Insert to: statements → transactions                   │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│  [Background] Queue AI categorization for unknown       │
│  merchants (non-blocking, batched)                      │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│  Display transactions with effective categories:        │
│    1. Check transaction_category_overrides              │
│    2. Check merchant_categories                         │
│    3. Try keyword matching                              │
│    4. Show "Uncategorized" (queue AI if not done)       │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│  User updates category (via dialog):                    │
│    • Transaction scope → Save to overrides table        │
│    • Merchant scope → Save to merchant_categories       │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Common Issues

For detailed troubleshooting, see **[`supabase/TROUBLESHOOTING.md`](supabase/TROUBLESHOOTING.md)**

**Quick fixes:**

**Syntax error with CONSTRAINT:**
- ✅ Fixed in `001_config.sql` - pull latest version

**Setup script fails:**
```bash
# Check if Supabase CLI is installed
supabase --version

# If not installed:
brew install supabase/tap/supabase
```

**"Permission denied" on setup-db.sh:**
```bash
chmod +x supabase/setup-db.sh
```

**"Table already exists" errors:**
```bash
supabase db reset  # ⚠️ Deletes all data
```

**RLS blocking queries:**
```sql
SELECT auth.jwt() ->> 'sub' AS user_id;  -- Check auth
```

📖 **See full troubleshooting guide:** `supabase/TROUBLESHOOTING.md`

---

## Support & Documentation

- **Setup Issues:** See `supabase/MIGRATION_SUMMARY.md`
- **API Usage:** See `docs/CATEGORIZATION.md`
- **Integration:** See `SETUP_CATEGORIZATION.md`
- **Migration Details:** See `supabase/migrations/README.md`
