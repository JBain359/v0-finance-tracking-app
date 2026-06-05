-- Create a function to get effective category for a transaction
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

  -- If found, return immediately
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

    -- If found, return immediately
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

-- Create a view that joins transactions with their effective categories
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

-- Grant access to the view (RLS will still apply via the transactions table)
GRANT SELECT ON transactions_with_categories TO authenticated, anon;
