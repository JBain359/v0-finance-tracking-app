-- Add user_id columns to all tables
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE statements ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add file_hash column and unique constraint to statements
ALTER TABLE statements ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE statements DROP CONSTRAINT IF EXISTS unique_user_file_hash;
ALTER TABLE statements ADD CONSTRAINT unique_user_file_hash 
  UNIQUE (user_id, file_hash, source_type);

-- Add account_id to statements table
ALTER TABLE statements ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS statements_user_id_idx ON statements(user_id);
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
CREATE INDEX IF NOT EXISTS statements_account_id_idx ON statements(account_id);

-- Enable Row Level Security on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

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

-- Create RLS Policies for transactions
-- These use auth.jwt() ->> 'sub' to extract user ID from third-party JWT (Descope)
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

-- Create RLS Policies for statements
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

-- Create RLS Policies for categories
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
