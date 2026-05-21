import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { getDescopeUserId } from "@/lib/supabase/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const userId = await getDescopeUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // RLS automatically ensures user can only access their own statements
    const { data: statement } = await supabase
      .from("statements")
      .select("blob_pathname")
      .eq("id", id)
      .single();

    if (!statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 },
      );
    }

    if (statement.blob_pathname) {
      try {
        // Delete from blob storage
        await del(statement.blob_pathname);
      } catch (e) {
        console.error("Failed to delete blob:", e);
      }
    }

    // Delete statement (transactions will cascade delete)
    // RLS automatically ensures user can only delete their own statements
    const { error } = await supabase.from("statements").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete statement" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
