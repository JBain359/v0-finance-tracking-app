import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  compareMonths,
  getMonthlySpending,
  getSpendingByCategory,
  getSpendingSummary,
  getTopMerchants,
  searchTransactions,
} from "./tools/tools";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: bedrock("us.anthropic.claude-sonnet-4-6"),
    system: `You are a helpful financial assistant that analyzes the user's transaction data. 
You have access to tools that can query their spending data from their uploaded bank and credit card statements.

When answering questions:
- Use the available tools to get accurate data
- Format currency amounts nicely (e.g., $1,234.56)
- Be concise but informative
- If there's no data available, let the user know they should upload statements first
- When showing categories, mention the specific amounts
- Round percentages to 1 decimal place

After using whatever tools necessary, please then present your findings back to the user.
`,
    messages: await convertToModelMessages(messages),
    tools: {
      getSpendingByCategory: tool({
        description:
          "Get total spending grouped by category for a given time period",
        inputSchema: getSpendingByCategory.schema,
        execute: getSpendingByCategory.function,
      }),

      getMonthlySpending: tool({
        description: "Get monthly spending totals over time",
        inputSchema: getMonthlySpending.schema,
        execute: getMonthlySpending.function,
      }),

      getTopMerchants: tool({
        description: "Get the merchants where the user spends the most",
        inputSchema: getTopMerchants.schema,
        execute: getTopMerchants.function,
      }),

      searchTransactions: tool({
        description:
          "Search for specific transactions by description or merchant",
        inputSchema: searchTransactions.schema,
        execute: searchTransactions.function,
      }),

      getSpendingSummary: tool({
        description:
          "Get a summary of overall spending including total spent, income, and transaction count",
        inputSchema: getSpendingSummary.schema,
        execute: getSpendingSummary.function,
      }),

      compareMonths: tool({
        description: "Compare spending between two months",
        inputSchema: compareMonths.schema,
        execute: compareMonths.function,
      }),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
