-- ============================================================================
-- SCHEMA DEFINITION
-- Run this file FIRST to create all tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Statements table
CREATE TABLE IF NOT EXISTS statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'pdf')),
  source_type TEXT NOT NULL CHECK (source_type IN ('bank', 'credit_card')),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  file_hash TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  row_count INTEGER DEFAULT 0
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  statement_id UUID REFERENCES statements(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('debit', 'credit')),
  category TEXT,
  merchant TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- MERCHANT CATEGORIZATION TABLES
-- ============================================================================

-- Merchant categories table - maps merchants to categories for each user
CREATE TABLE IF NOT EXISTS merchant_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  merchant TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'ai', 'keyword')),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_merchant UNIQUE (user_id, merchant)
);

-- Transaction category overrides - transaction-specific category assignments
CREATE TABLE IF NOT EXISTS transaction_category_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_transaction_override UNIQUE (transaction_id)
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get effective category for a transaction
-- Priority: override > merchant category > transaction.category > 'Uncategorized'
CREATE OR REPLACE FUNCTION get_transaction_effective_category(
  p_transaction_id UUID,
  p_user_id TEXT,
  p_merchant TEXT,
  p_default_category TEXT
)
RETURNS TABLE (
  category_name TEXT,
  category_id UUID,
  category_source TEXT
) AS $$
BEGIN
  -- Check for transaction override
  RETURN QUERY
  SELECT
    tco.category_name,
    tco.category_id,
    'override'::TEXT as category_source
  FROM transaction_category_overrides tco
  WHERE tco.transaction_id = p_transaction_id
    AND tco.user_id = p_user_id
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  -- Check for merchant category
  IF p_merchant IS NOT NULL THEN
    RETURN QUERY
    SELECT
      mc.category_name,
      mc.category_id,
      'merchant'::TEXT as category_source
    FROM merchant_categories mc
    WHERE mc.merchant = p_merchant
      AND mc.user_id = p_user_id
    LIMIT 1;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- Return default category
  RETURN QUERY
  SELECT
    COALESCE(p_default_category, 'Uncategorized')::TEXT as category_name,
    NULL::UUID as category_id,
    'default'::TEXT as category_source;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to execute free-form SELECT queries (with limits)
CREATE OR REPLACE FUNCTION execute_query(query_text TEXT, query_params JSONB DEFAULT '[]')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Extra server-side guard: only allow SELECT
  IF lower(trim(query_text)) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are permitted';
  END IF;

  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM (%s) t LIMIT 500) t', query_text)
  INTO result;

  RETURN COALESCE(result, '[]'::JSONB);
END;
$$;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View that joins transactions with their effective categories
CREATE OR REPLACE VIEW transactions_with_categories AS
SELECT
  t.*,
  COALESCE(
    (SELECT category_name FROM get_transaction_effective_category(t.id, t.user_id, t.merchant, t.category) LIMIT 1),
    t.category,
    'Uncategorized'
  ) as effective_category,
  COALESCE(
    (SELECT category_id FROM get_transaction_effective_category(t.id, t.user_id, t.merchant, t.category) LIMIT 1),
    NULL
  ) as effective_category_id,
  COALESCE(
    (SELECT category_source FROM get_transaction_effective_category(t.id, t.user_id, t.merchant, t.category) LIMIT 1),
    'default'
  ) as category_source
FROM transactions t;
