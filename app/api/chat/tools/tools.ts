import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const getSpendingByCategory = {
  schema: z.object({
    startDate: z
      .string()
      .optional()
      .describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Number of categories to return"),
  }),
  function: async ({
    startDate,
    endDate,
    limit,
  }: {
    limit: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
  }) => {
    try {
      const supabase = await createClient();

      let query = supabase
        .from("transactions")
        .select("category, amount")
        .eq("transaction_type", "debit");

      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);

      const { data, error } = await query;

      if (error) {
        console.error("getSpendingByCategory DB error:", error);
        return { error: error.message };
      }

      if (!data || data.length === 0) {
        return {
          categories: [],
          message: "No spending data found for this period",
        };
      }

      const categoryTotals: Record<string, number> = {};
      data.forEach((t) => {
        const cat = t.category || "Other";
        categoryTotals[cat] =
          (categoryTotals[cat] || 0) + Math.abs(Number(t.amount));
      });

      const sorted = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([category, total]) => ({
          category,
          total: Math.round(total * 100) / 100,
        }));

      const grandTotal = sorted.reduce((sum, c) => sum + c.total, 0);

      return {
        categories: sorted,
        total: Math.round(grandTotal * 100) / 100,
        startDate,
        endDate,
      };
    } catch (e) {
      console.error("getSpendingByCategory error:", e);
      return { error: String(e) };
    }
  },
};

export const getMonthlySpending = {
  schema: z.object({
    months: z
      .number()
      .optional()
      .default(6)
      .describe("Number of months to look back"),
  }),
  function: async ({ months = 6 }: { months: number | undefined }) => {
    try {
      const supabase = await createClient();

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data, error } = await supabase
        .from("transactions")
        .select("date, amount")
        .eq("transaction_type", "debit")
        .gte("date", startDate.toISOString().split("T")[0]);

      if (error) {
        console.error("getMonthlySpending DB error:", error);
        return { error: error.message };
      }

      if (!data || data.length === 0) {
        return { months: [], message: "No spending data found" };
      }

      const monthlyTotals: Record<string, number> = {};
      data.forEach((t) => {
        const month = new Date(t.date).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        monthlyTotals[month] =
          (monthlyTotals[month] || 0) + Math.abs(Number(t.amount));
      });

      const sorted = Object.entries(monthlyTotals).map(([month, total]) => ({
        month,
        total: Math.round(total * 100) / 100,
      }));

      return { months: sorted };
    } catch (e) {
      console.error("getMonthlySpending error:", e);
      return { error: String(e) };
    }
  },
};

export const getTopMerchants = {
  schema: z.object({
    startDate: z
      .string()
      .optional()
      .describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Number of merchants to return"),
  }),
  function: async ({
    startDate,
    endDate,
    limit,
  }: {
    startDate?: string | undefined;
    endDate?: string | undefined;
    limit?: number | undefined;
  }) => {
    try {
      const supabase = await createClient();

      let query = supabase
        .from("transactions")
        .select("merchant, description, amount")
        .eq("transaction_type", "debit");

      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);

      const { data, error } = await query;

      if (error) {
        console.error("getTopMerchants DB error:", error);
        return { error: error.message };
      }

      if (!data || data.length === 0) {
        return { merchants: [], message: "No spending data found" };
      }

      const merchantTotals: Record<string, { total: number; count: number }> =
        {};
      data.forEach((t) => {
        const merchant = t.merchant || t.description || "Unknown";
        if (!merchantTotals[merchant]) {
          merchantTotals[merchant] = { total: 0, count: 0 };
        }
        merchantTotals[merchant].total += Math.abs(Number(t.amount));
        merchantTotals[merchant].count += 1;
      });

      const sorted = Object.entries(merchantTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, limit)
        .map(([merchant, { total, count }]) => ({
          merchant,
          total: Math.round(total * 100) / 100,
          transactionCount: count,
        }));

      return { merchants: sorted };
    } catch (e) {
      console.error("getTopMerchants error:", e);
      return { error: String(e) };
    }
  },
};

export const searchTransactions = {
  schema: z.object({
    query: z
      .string()
      .describe("Search term to look for in transaction descriptions"),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Number of results to return"),
  }),
  function: async ({
    query,
    limit = 20,
  }: {
    query: string;
    limit?: number | undefined;
  }) => {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("transactions")
        .select(
          "date, description, merchant, amount, category, transaction_type",
        )
        .or(`description.ilike.%${query}%,merchant.ilike.%${query}%`)
        .order("date", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("searchTransactions DB error:", error);
        return { error: error.message };
      }

      if (!data || data.length === 0) {
        return {
          transactions: [],
          message: `No transactions found matching "${query}"`,
        };
      }

      return {
        transactions: data.map((t) => ({
          ...t,
          amount: Math.round(Math.abs(Number(t.amount)) * 100) / 100,
        })),
        count: data.length,
      };
    } catch (e) {
      console.error("searchTransactions error:", e);
      return { error: String(e) };
    }
  },
};

export const getSpendingSummary = {
  schema: z.object({
    startDate: z
      .string()
      .optional()
      .describe("Start date in YYYY-MM-DD format"),
    endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
  }),
  function: async ({
    startDate,
    endDate,
  }: {
    startDate?: string | undefined;
    endDate?: string | undefined;
  }) => {
    try {
      const supabase = await createClient();

      let query = supabase
        .from("transactions")
        .select("amount, transaction_type");

      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);

      const { data, error } = await query;

      if (error) {
        console.error("getSpendingSummary DB error:", error);
        return { error: error.message };
      }

      if (!data || data.length === 0) {
        return { message: "No transaction data found" };
      }

      const debits = data.filter((t) => t.transaction_type === "debit");
      const credits = data.filter((t) => t.transaction_type === "credit");

      const totalSpent = debits.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0,
      );
      const totalIncome = credits.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0,
      );

      return {
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        netCashFlow: Math.round((totalIncome - totalSpent) * 100) / 100,
        transactionCount: data.length,
        expenseCount: debits.length,
        incomeCount: credits.length,
        startDate,
        endDate,
      };
    } catch (e) {
      console.error("getSpendingSummary error:", e);
      return { error: String(e) };
    }
  },
};

export const compareMonths = {
  schema: z.object({
    month1: z.string().describe("First month in YYYY-MM format"),
    month2: z.string().describe("Second month in YYYY-MM format"),
  }),
  function: async ({ month1, month2 }: { month1: string; month2: string }) => {
    try {
      const supabase = await createClient();

      const getMonthData = async (month: string) => {
        const startDate = `${month}-01`;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        const { data, error } = await supabase
          .from("transactions")
          .select("amount, category")
          .eq("transaction_type", "debit")
          .gte("date", startDate)
          .lte("date", endDate.toISOString().split("T")[0]);

        if (error) throw new Error(error.message);
        if (!data) return { total: 0, categories: {} };

        const total = data.reduce(
          (sum, t) => sum + Math.abs(Number(t.amount)),
          0,
        );
        const categories: Record<string, number> = {};
        data.forEach((t) => {
          const cat = t.category || "Other";
          categories[cat] = (categories[cat] || 0) + Math.abs(Number(t.amount));
        });

        return { total: Math.round(total * 100) / 100, categories };
      };

      const [data1, data2] = await Promise.all([
        getMonthData(month1),
        getMonthData(month2),
      ]);

      const difference = data2.total - data1.total;
      const percentChange =
        data1.total > 0
          ? Math.round((difference / data1.total) * 1000) / 10
          : 0;

      return {
        month1: { month: month1, ...data1 },
        month2: { month: month2, ...data2 },
        difference: Math.round(difference * 100) / 100,
        percentChange,
      };
    } catch (e) {
      console.error("compareMonths error:", e);
      return { error: String(e) };
    }
  },
};

export const executeQuery = {
  schema: z.object({
    sql: z
      .string()
      .describe(
        "A raw SQL SELECT query to run against the transactions database. Must be a read-only SELECT statement.",
      ),
    params: z
      .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional()
      .describe("Optional positional parameters ($1, $2, ...) for the query"),
  }),
  function: async ({
    sql,
    params,
  }: {
    sql: string;
    params?: (string | number | boolean | null)[] | undefined;
  }) => {
    try {
      // Enforce read-only: reject anything that isn't a SELECT
      const normalized = sql.trim().toLowerCase();
      if (!normalized.startsWith("select")) {
        return {
          error:
            "Only SELECT queries are permitted. Mutations (INSERT, UPDATE, DELETE, DROP, etc.) are not allowed.",
        };
      }
 
      // Block common mutation keywords as a second layer of defense
      const forbiddenKeywords = [
        /\binsert\b/i,
        /\bupdate\b/i,
        /\bdelete\b/i,
        /\bdrop\b/i,
        /\btruncate\b/i,
        /\balter\b/i,
        /\bcreate\b/i,
        /\bgrant\b/i,
        /\brevoke\b/i,
      ];
      for (const pattern of forbiddenKeywords) {
        if (pattern.test(sql)) {
          return {
            error: `Query contains a forbidden keyword. Only read-only SELECT queries are allowed.`,
          };
        }
      }
 
      const supabase = await createClient();
 
      const { data, error } = await supabase.rpc("execute_query", {
        query_text: sql,
        query_params: params ?? [],
      });
 
      if (error) {
        console.error("executeQuery DB error:", error);
        return { error: error.message };
      }
 
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { rows: [], count: 0, message: "Query returned no results." };
      }
 
      return {
        rows: data,
        count: Array.isArray(data) ? data.length : 1,
      };
    } catch (e) {
      console.error("executeQuery error:", e);
      return { error: String(e) };
    }
  },
};
