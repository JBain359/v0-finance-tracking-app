import type { Category } from "./types";

interface CategorizeResult {
  category: string;
  merchant: string | null;
}

export function categorizeTransaction(
  description: string,
  categories: Category[],
): CategorizeResult {
  const lowerDesc = description.toLowerCase();

  // Extract merchant name (usually the first meaningful part)
  const merchant = extractMerchant(description);

  // Find matching category based on keywords
  for (const category of categories) {
    if (category.keywords && category.keywords.length > 0) {
      for (const keyword of category.keywords) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          return { category: category.name, merchant };
        }
      }
    }
  }

  // Default to "Other" if no match found
  return { category: "Other", merchant };
}

function extractMerchant(description: string): string | null {
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
