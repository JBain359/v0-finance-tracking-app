import { useState } from "react";
import { useSWRConfig } from "swr";

interface UpdateCategoryOptions {
  transactionId: string;
  categoryName: string;
  categoryId: string | null;
  scope: "transaction" | "merchant";
  merchant?: string;
}

interface CategoryInfo {
  category_name: string;
  category_id: string | null;
  source: "override" | "merchant" | "default" | "ai" | "keyword";
  confidence?: number;
}

export function useTransactionCategorization() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const updateCategory = async (options: UpdateCategoryOptions) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update category");
      }

      const result = await response.json();

      // Invalidate relevant SWR caches
      mutate((key) => {
        if (typeof key === "string") {
          return (
            key.includes("/api/transactions") ||
            key.includes("/api/stats") ||
            key.includes("/api/categories")
          );
        }
        return false;
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const getCategory = async (transactionId: string): Promise<CategoryInfo> => {
    try {
      const response = await fetch(
        `/api/transactions/categorize?transactionId=${transactionId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to retrieve category");
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    }
  };

  return {
    updateCategory,
    getCategory,
    isUpdating,
    error,
  };
}
