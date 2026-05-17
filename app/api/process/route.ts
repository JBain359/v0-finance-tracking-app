import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import Papa from "papaparse";
import { categorizeTransaction } from "@/lib/categorize";

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

export async function POST(request: NextRequest) {
  try {
    const { statementId } = await request.json();

    if (!statementId) {
      return NextResponse.json(
        { error: "Statement ID required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get statement record
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

    // Get categories for matching
    const { data: categories } = await supabase.from("categories").select("*");
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

    // Categorize and insert transactions
    const transactionsToInsert = transactions.map((t) => {
      const { category, merchant } = categorizeTransaction(
        t.description,
        categoryList,
      );
      return {
        statement_id: statementId,
        date: t.date,
        description: t.description,
        amount: t.amount,
        transaction_type: t.transaction_type,
        category,
        merchant,
        raw_data: t,
      };
    });

    const { error: insertError } = await supabase
      .from("transactions")
      .insert(transactionsToInsert);

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

    return NextResponse.json({
      success: true,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
