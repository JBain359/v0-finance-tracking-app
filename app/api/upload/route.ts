import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sourceType = formData.get("sourceType") as "bank" | "credit_card";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "csv" && fileExtension !== "pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only CSV and PDF files are allowed." },
        { status: 400 },
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`statements/${Date.now()}-${file.name}`, file, {
      access: "private",
    });

    // Create statement record in database
    const supabase = await createClient();
    const { data: statement, error } = await supabase
      .from("statements")
      .insert({
        filename: file.name,
        blob_pathname: blob.pathname,
        file_type: fileExtension as "csv" | "pdf",
        source_type: sourceType,
        processed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
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
