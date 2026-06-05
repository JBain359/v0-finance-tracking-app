-- ============================================================================
-- CONFIGURATION & SECURITY
-- Run this file SECOND after 000_schema.sql
-- ============================================================================

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Unique constraint for statements to prevent duplicate uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_file_hash'
  ) THEN
    ALTER TABLE statements ADD CONSTRAINT unique_user_file_hash
      UNIQUE (user_id, file_hash, source_type);
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);
CREATE INDEX IF NOT EXISTS transactions_merchant_idx ON transactions(merchant);
CREATE INDEX IF NOT EXISTS transactions_statement_id_idx ON transactions(statement_id);

CREATE INDEX IF NOT EXISTS statements_user_id_idx ON statements(user_id);
CREATE INDEX IF NOT EXISTS statements_account_id_idx ON statements(account_id);
CREATE INDEX IF NOT EXISTS statements_processed_idx ON statements(processed);

CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE INDEX IF NOT EXISTS categories_name_idx ON categories(name);

CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);

-- Merchant categorization indexes
CREATE INDEX IF NOT EXISTS merchant_categories_user_id_idx ON merchant_categories(user_id);
CREATE INDEX IF NOT EXISTS merchant_categories_merchant_idx ON merchant_categories(user_id, merchant);
CREATE INDEX IF NOT EXISTS merchant_categories_source_idx ON merchant_categories(source);

CREATE INDEX IF NOT EXISTS transaction_overrides_user_id_idx ON transaction_category_overrides(user_id);
CREATE INDEX IF NOT EXISTS transaction_overrides_transaction_id_idx ON transaction_category_overrides(transaction_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps automatically
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchant_categories_updated_at ON merchant_categories;
CREATE TRIGGER update_merchant_categories_updated_at
  BEFORE UPDATE ON merchant_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transaction_overrides_updated_at ON transaction_category_overrides;
CREATE TRIGGER update_transaction_overrides_updated_at
  BEFORE UPDATE ON transaction_category_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_category_overrides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own statements" ON statements;
DROP POLICY IF EXISTS "Users can insert own statements" ON statements;
DROP POLICY IF EXISTS "Users can update own statements" ON statements;
DROP POLICY IF EXISTS "Users can delete own statements" ON statements;

DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;

DROP POLICY IF EXISTS "Users can view own merchant categories" ON merchant_categories;
DROP POLICY IF EXISTS "Users can insert own merchant categories" ON merchant_categories;
DROP POLICY IF EXISTS "Users can update own merchant categories" ON merchant_categories;
DROP POLICY IF EXISTS "Users can delete own merchant categories" ON merchant_categories;

DROP POLICY IF EXISTS "Users can view own transaction overrides" ON transaction_category_overrides;
DROP POLICY IF EXISTS "Users can insert own transaction overrides" ON transaction_category_overrides;
DROP POLICY IF EXISTS "Users can update own transaction overrides" ON transaction_category_overrides;
DROP POLICY IF EXISTS "Users can delete own transaction overrides" ON transaction_category_overrides;

-- ============================================================================
-- RLS POLICIES - TRANSACTIONS
-- ============================================================================

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- RLS POLICIES - STATEMENTS
-- ============================================================================

CREATE POLICY "Users can view own statements"
  ON statements FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own statements"
  ON statements FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own statements"
  ON statements FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own statements"
  ON statements FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- RLS POLICIES - CATEGORIES
-- ============================================================================

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- RLS POLICIES - ACCOUNTS
-- ============================================================================

CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- RLS POLICIES - MERCHANT CATEGORIES
-- ============================================================================

CREATE POLICY "Users can view own merchant categories"
  ON merchant_categories FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own merchant categories"
  ON merchant_categories FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own merchant categories"
  ON merchant_categories FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own merchant categories"
  ON merchant_categories FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- RLS POLICIES - TRANSACTION CATEGORY OVERRIDES
-- ============================================================================

CREATE POLICY "Users can view own transaction overrides"
  ON transaction_category_overrides FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own transaction overrides"
  ON transaction_category_overrides FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own transaction overrides"
  ON transaction_category_overrides FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own transaction overrides"
  ON transaction_category_overrides FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to the view
GRANT SELECT ON transactions_with_categories TO authenticated, anon;
