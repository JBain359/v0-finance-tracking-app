import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { generateText, Output } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDescopeUserId } from "@/lib/supabase/auth";
import Papa from "papaparse";
import { extractMerchant, saveMerchantCategory } from "@/lib/categorization-service";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit";
}

function parseCSV(content: string): ParsedTransaction[] {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().trim(),
  });

  const transactions: ParsedTransaction[] = [];

  for (const row of result.data as Record<string, string>[]) {
    // Try to find date column
    const dateValue =
      row["date"] ||
      row["transaction date"] ||
      row["post date"] ||
      row["posting date"] ||
      Object.values(row)[0];

    // Try to find description column
    const description =
      row["description"] ||
      row["memo"] ||
      row["merchant"] ||
      row["name"] ||
      row["payee"] ||
      Object.values(row)[1] ||
      "";

    // Try to find amount column(s)
    let amount = 0;
    let transactionType: "debit" | "credit" = "debit";

    // Check for separate debit/credit columns
    const debit = parseFloat(
      (row["debit"] || row["withdrawal"] || row["amount debit"] || "0").replace(
        /[^0-9.-]/g,
        "",
      ),
    );
    const credit = parseFloat(
      (row["credit"] || row["deposit"] || row["amount credit"] || "0").replace(
        /[^0-9.-]/g,
        "",
      ),
    );

    if (debit && !isNaN(debit) && debit !== 0) {
      amount = Math.abs(debit);
      transactionType = "debit";
    } else if (credit && !isNaN(credit) && credit !== 0) {
      amount = Math.abs(credit);
      transactionType = "credit";
    } else {
      // Try single amount column
      const amountStr =
        row["amount"] ||
        row["transaction amount"] ||
        Object.values(row)[2] ||
        "0";
      amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ""));

      if (!isNaN(amount)) {
        if (amount < 0) {
          transactionType = "debit";
          amount = Math.abs(amount);
        } else {
          transactionType = "credit";
        }
      }
    }

    // Parse date
    let parsedDate: Date | null = null;
    if (dateValue) {
      parsedDate = new Date(dateValue);
      if (isNaN(parsedDate.getTime())) {
        // Try different date formats
        const parts = dateValue.split(/[/-]/);
        if (parts.length === 3) {
          // Try MM/DD/YYYY
          parsedDate = new Date(
            `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`,
          );
        }
      }
    }

    if (
      parsedDate &&
      !isNaN(parsedDate.getTime()) &&
      description &&
      amount > 0
    ) {
      transactions.push({
        date: parsedDate.toISOString().split("T")[0],
        description: description.trim(),
        amount,
        transaction_type: transactionType,
      });
    }
  }

  return transactions;
}

const categorizationSchema = z.object({
  category: z.string().describe("The category name from the available categories"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
});

/**
 * Categorize a transaction using AI
 */
async function categorizeWithAI(
  merchant: string,
  description: string,
  availableCategories: string[],
): Promise<{ category: string; confidence: number }> {
  try {
    const categoryList = availableCategories.length > 0
      ? availableCategories.join(", ")
      : "Groceries, Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Other";
    console.log("running haiku!")
    const result = await generateText({
      model: bedrock("us.anthropic.claude-haiku-4-5-20251001-v1:0"),
      prompt: `Categorize this financial transaction into the most appropriate category.

Merchant: ${merchant}
Description: ${description}

Available categories: ${categoryList}

Analyze the merchant name and description to determine which category fits best. Choose from the available categories listed above. If none fit well, choose "Other".

Provide a confidence score between 0 and 1 based on how certain you are:
- 0.9-1.0: Very confident (clear match)
- 0.7-0.9: Confident (good match)
- 0.5-0.7: Somewhat confident (reasonable match)
- 0.3-0.5: Uncertain (weak match)
- 0.0-0.3: Very uncertain (fallback to Other)`,
      output: Output.object({ schema: categorizationSchema }),
    });
    
    console.log({
      category: result.output.category,
      confidence: result.output.confidence,
    })
    return {
      category: result.output.category,
      confidence: result.output.confidence,
    };
  } catch (error) {
    console.error("AI categorization failed:", error);
    return {
      category: "Other",
      confidence: 0.0,
    };
  }
}

/**
 * Trigger background categorization for newly uploaded transactions
 * This runs asynchronously and doesn't block the upload response
 */
async function triggerBackgroundCategorization(
  transactions: any[],
  userId: string,
  supabase: any,
  categories: Array<{ id: string; name: string }>,
): Promise<void> {
  console.log("categorizing in background!")
  // Get unique merchants from transactions
  const uniqueMerchants = new Map<string, { merchant: string; description: string }>();

  for (const transaction of transactions) {
    if (transaction.merchant && !uniqueMerchants.has(transaction.merchant)) {
      uniqueMerchants.set(transaction.merchant, {
        merchant: transaction.merchant,
        description: transaction.description,
      });
    }
  }

  // Process merchants in batches
  const BATCH_SIZE = 5;
  const merchantEntries = Array.from(uniqueMerchants.values());
  console.log (merchantEntries)

  for (let i = 0; i < merchantEntries.length; i += BATCH_SIZE) {
    const batch = merchantEntries.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    await Promise.all(
      batch.map(async ({ merchant, description }) => {
        try {
          console.log(merchant)
          // Check if merchant already has a category
          const { data: existing } = await supabase
            .from("merchant_categories")
            .select("id")
            .eq("user_id", userId)
            .eq("merchant", merchant)
            .single();
          console.log(existing)
          // Skip if already categorized
          if (existing) return;
          console.log("new!")

          // Categorize with AI
          const result = await categorizeWithAI(
            merchant,
            description,
            categories.map((c) => c.name),
          );

          console.log(result.category)
          if (!result.category) return;

          // Find matching category ID
          const matchingCategory = categories.find(
            (cat) => cat.name.toLowerCase() === result.category.toLowerCase(),
          );

          // Save merchant category
          await saveMerchantCategory(
            userId,
            merchant,
            result.category,
            matchingCategory?.id || null,
            "ai",
            supabase,
            result.confidence,
          );
        } catch (err) {
          console.error(`Failed to categorize merchant ${merchant}:`, err);
        }
      })
    );

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < merchantEntries.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getDescopeUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { statementId } = await request.json();

    if (!statementId) {
      return NextResponse.json(
        { error: "Statement ID required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get statement record (RLS will ensure user owns this statement)
    const { data: statement, error: fetchError } = await supabase
      .from("statements")
      .select("*")
      .eq("id", statementId)
      .single();

    if (fetchError || !statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 },
      );
    }

    // Get user's categories for AI categorization
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId);
    const categoryList = categories || [];

    // Get file from blob storage
    const result = await get(statement.blob_pathname, { access: "private" });

    if (!result || !result.stream) {
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 404 },
      );
    }

    let transactions: ParsedTransaction[] = [];

    if (statement.file_type === "csv") {
      // Read stream to text
      const reader = result.stream.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const content = new TextDecoder().decode(
        chunks.reduce((acc, chunk) => {
          const newArr = new Uint8Array(acc.length + chunk.length);
          newArr.set(acc);
          newArr.set(chunk, acc.length);
          return newArr;
        }, new Uint8Array(0)),
      );

      transactions = parseCSV(content);
    } else {
      // For PDF, we'd need pdf-parse which requires more setup
      // For now, return an error for PDF files
      return NextResponse.json(
        {
          error:
            "PDF parsing is not yet fully supported. Please use CSV files.",
        },
        { status: 400 },
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found in file" },
        { status: 400 },
      );
    }

    // Extract merchant and prepare transactions for insertion
    const transactionsToInsert = transactions.map((t) => {
      const merchant = extractMerchant(t.description);
      return {
        user_id: userId,
        statement_id: statementId,
        date: t.date,
        description: t.description,
        amount: t.amount,
        transaction_type: t.transaction_type,
        category: null, // Will be determined by categorization service
        merchant,
        raw_data: t,
      };
    });

    const { data: insertedTransactions, error: insertError } = await supabase
      .from("transactions")
      .insert(transactionsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save transactions" },
        { status: 500 },
      );
    }

    // Update statement as processed
    await supabase
      .from("statements")
      .update({ processed: true, row_count: transactions.length })
      .eq("id", statementId);

    // Trigger background categorization for new transactions (non-blocking)
    if (insertedTransactions && insertedTransactions.length > 0 ) {
      // Don't await - let it run in the background
      triggerBackgroundCategorization(
        insertedTransactions,
        userId,
        supabase,
        categoryList,
      ).catch((err) => {
        console.error("Background categorization failed:", err);
      });
    }

    return NextResponse.json({
      success: true,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
