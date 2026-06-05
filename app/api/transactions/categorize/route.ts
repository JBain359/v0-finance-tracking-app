import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  saveMerchantCategory,
  saveTransactionOverride,
} from "@/lib/categorization-service";

interface CategorizeRequest {
  transactionId: string;
  categoryName: string;
  categoryId: string | null;
  scope: "transaction" | "merchant"; // Apply to this transaction only, or all transactions from this merchant
  merchant?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CategorizeRequest = await request.json();
    const { transactionId, categoryName, categoryId, scope, merchant } = body;

    if (!transactionId || !categoryName || !scope) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    if (scope === "transaction") {
      // Save transaction-specific override
      await saveTransactionOverride(
        userId,
        transactionId,
        categoryName,
        categoryId,
        supabase,
      );

      return NextResponse.json({
        success: true,
        message: "Category updated for this transaction",
      });
    } else if (scope === "merchant") {
      // Update merchant category mapping
      if (!merchant) {
        return NextResponse.json(
          { error: "Merchant is required for merchant-level categorization" },
          { status: 400 },
        );
      }

      await saveMerchantCategory(
        userId,
        merchant,
        categoryName,
        categoryId,
        "user",
        supabase,
      );

      // Remove any transaction-specific override for this transaction
      // since the merchant-level category now applies
      await supabase
        .from("transaction_category_overrides")
        .delete()
        .eq("transaction_id", transactionId)
        .eq("user_id", userId);

      // Count how many transactions will be affected
      const { count } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("merchant", merchant);

      return NextResponse.json({
        success: true,
        message: `Category updated for all transactions from ${merchant}`,
        affectedCount: count || 0,
      });
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (error) {
    console.error("Categorization update error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

// GET endpoint to retrieve category for a transaction
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get transaction details
    const { data: transaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", user.id)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Check for override
    const { data: override } = await supabase
      .from("transaction_category_overrides")
      .select("*")
      .eq("transaction_id", transactionId)
      .eq("user_id", user.id)
      .single();

    if (override) {
      return NextResponse.json({
        category_name: override.category_name,
        category_id: override.category_id,
        source: "override",
      });
    }

    // Check for merchant category
    if (transaction.merchant) {
      const { data: merchantCategory } = await supabase
        .from("merchant_categories")
        .select("*")
        .eq("merchant", transaction.merchant)
        .eq("user_id", user.id)
        .single();

      if (merchantCategory) {
        return NextResponse.json({
          category_name: merchantCategory.category_name,
          category_id: merchantCategory.category_id,
          source: merchantCategory.source,
          confidence: merchantCategory.confidence,
        });
      }
    }

    return NextResponse.json({
      category_name: transaction.category || "Uncategorized",
      category_id: null,
      source: "default",
    });
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve category" },
      { status: 500 },
    );
  }
}
