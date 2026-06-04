import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { getDescopeUserId } from "@/lib/supabase/auth";
import { createHash } from "crypto";

async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getDescopeUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const accountId = formData.get("accountId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "No account selected" },
        { status: 400 },
      );
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "csv" && fileExtension !== "pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only CSV and PDF files are allowed." },
        { status: 400 },
      );
    }

    // Compute hash before uploading anything
    const fileHash = await computeFileHash(file);

    // Check for duplicate before touching Blob storage
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("statements")
      .select("id, filename, created_at")
      .eq("user_id", userId)
      .eq("file_hash", fileHash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "Duplicate file",
          message: `This file has already been uploaded`,
          existingStatement: {
            id: existing.id,
            filename: existing.filename,
            uploadedAt: existing.created_at,
          },
        },
        { status: 409 },
      );
    }

    // Only upload to Blob after passing duplicate check
    const blob = await put(`statements/${Date.now()}-${file.name}`, file, {
      access: "private",
    });

    const { data: statement, error } = await supabase
      .from("statements")
      .insert({
        user_id: userId,
        filename: file.name,
        blob_pathname: blob.pathname,
        file_type: fileExtension as "csv" | "pdf",
        account_id: accountId,
        file_hash: fileHash,
        processed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

      // Check if it's a duplicate key violation
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error: "Duplicate file",
            message: "This file has already been uploaded to this account",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Failed to save statement record" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      statementId: statement.id,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}