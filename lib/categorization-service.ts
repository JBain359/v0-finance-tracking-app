/**
 * Categorization Service
 *
 * Utility functions for managing merchant and transaction categorization.
 * AI categorization now happens inline in /api/process during statement upload.
 */

/**
 * Save or update a merchant category mapping
 * Used by:
 * - /api/process (AI categorization)
 * - /api/transactions/categorize (user updates)
 */
export async function saveMerchantCategory(
  userId: string,
  merchant: string,
  categoryName: string,
  categoryId: string | null,
  source: "user" | "ai" | "keyword",
  supabase: any,
  confidence?: number,
): Promise<void> {
  await supabase.from("merchant_categories").upsert(
    {
      user_id: userId,
      merchant,
      category_name: categoryName,
      category_id: categoryId,
      source,
      confidence,
    },
    {
      onConflict: "user_id,merchant",
    },
  );
}

/**
 * Save or update a transaction-specific category override
 * Used by: /api/transactions/categorize
 */
export async function saveTransactionOverride(
  userId: string,
  transactionId: string,
  categoryName: string,
  categoryId: string | null,
  supabase: any,
): Promise<void> {
  await supabase.from("transaction_category_overrides").upsert(
    {
      user_id: userId,
      transaction_id: transactionId,
      category_name: categoryName,
      category_id: categoryId,
    },
    {
      onConflict: "transaction_id",
    },
  );
}

/**
 * Extract merchant name from transaction description
 * Used by: /api/process
 */
export function extractMerchant(description: string): string | null {
  // Remove common prefixes
  let cleaned = description
    .replace(
      /^(pos|ach|debit|credit|purchase|payment|checkcard|check card)/i,
      "",
    )
    .replace(/\d{2}\/\d{2}/g, "") // Remove dates like 01/15
    .replace(/\d{4,}/g, "") // Remove long numbers
    .replace(/\s{2,}/g, " ")
    .trim();

  // Take the first part before common separators
  const parts = cleaned.split(/[-*#]/);
  if (parts.length > 0 && parts[0].trim()) {
    return parts[0].trim().slice(0, 50); // Limit length
  }

  return cleaned.slice(0, 50) || null;
}
