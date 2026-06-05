-- Create merchant_categories table for storing merchant-to-category mappings
CREATE TABLE IF NOT EXISTS merchant_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  merchant TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  -- Track if this was AI-suggested or user-confirmed
  source TEXT NOT NULL DEFAULT 'user', -- 'user', 'ai', 'keyword'
  confidence FLOAT, -- AI confidence score (0-1) if applicable
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Ensure one merchant per user
  CONSTRAINT unique_user_merchant UNIQUE (user_id, merchant)
);

-- Create transaction_category_overrides table for transaction-specific overrides
CREATE TABLE IF NOT EXISTS transaction_category_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Ensure one override per transaction
  CONSTRAINT unique_transaction_override UNIQUE (transaction_id)
);

-- Add user_id column to merchant_categories and transaction_category_overrides
ALTER TABLE merchant_categories ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE transaction_category_overrides ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS merchant_categories_user_id_idx ON merchant_categories(user_id);
CREATE INDEX IF NOT EXISTS merchant_categories_merchant_idx ON merchant_categories(user_id, merchant);
CREATE INDEX IF NOT EXISTS merchant_categories_source_idx ON merchant_categories(source);
CREATE INDEX IF NOT EXISTS transaction_overrides_user_id_idx ON transaction_category_overrides(user_id);
CREATE INDEX IF NOT EXISTS transaction_overrides_transaction_id_idx ON transaction_category_overrides(transaction_id);

-- Enable Row Level Security
ALTER TABLE merchant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_category_overrides ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for merchant_categories
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

-- Create RLS Policies for transaction_category_overrides
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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
