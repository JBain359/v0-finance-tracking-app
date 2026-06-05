# Legacy Migration Files (Archived)

These files have been **consolidated** into the new migration system and are **no longer needed** for new setups.

## What Happened

The old migrations (001-004) have been merged into two comprehensive files:

| Old File                            | Now In                                   | Status          |
| ----------------------------------- | ---------------------------------------- | --------------- |
| `001_add_rls.sql`                   | `001_config.sql`                         | ✅ Consolidated |
| `002_free_query.sql`                | `000_schema.sql`                         | ✅ Consolidated |
| `003_merchant_categories.sql`       | Both `000_schema.sql` & `001_config.sql` | ✅ Consolidated |
| `004_transaction_category_view.sql` | `000_schema.sql`                         | ✅ Consolidated |

## Current Migration Files

**Use these instead:**

- `../000_schema.sql` - All tables, functions, views
- `../001_config.sql` - All indexes, RLS policies, triggers

## Can I Delete These?

**Yes, for new setups.** These files are kept as backup only.

**If you already ran these migrations** on an existing database, you can:

1. Keep them for reference
2. Delete them (the database already has the changes)
3. Reset database and use the new files: `supabase db reset`

## How to Use New System

```bash
# Run from /supabase directory
./setup-db.sh

# Or manually
supabase db execute --file migrations/000_schema.sql
supabase db execute --file migrations/001_config.sql
```

## Restore Old System (Not Recommended)

If you need to go back to the old migration system:

```bash
# Move files back
mv legacy_backup/*.sql ../

# Remove new files
rm ../000_schema.sql
rm ../001_config.sql
```

---

**Archived:** 2024-06-05  
**Reason:** Consolidated into `000_schema.sql` and `001_config.sql` for easier management
