"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Account } from "@/lib/types";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch((err) => console.error("Failed to load accounts:", err));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      (droppedFile.type === "text/csv" ||
        droppedFile.type === "application/pdf" ||
        droppedFile.name.endsWith(".csv"))
    ) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please upload a CSV or PDF file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !accountId) return;

    setStatus("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", accountId);

      const response = await fetch("/api/statements/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();

        // Handle duplicate file error specially
        if (response.status === 409) {
          setStatus("error");
          setError(
            data.message ||
              "This file has already been uploaded to this account",
          );
          return;
        }

        throw new Error(data.error || "Upload failed");
      }

      setStatus("processing");
      const data = await response.json();

      // Process the statement
      const processResponse = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId: data.statementId }),
      });

      if (!processResponse.ok) {
        const processData = await processResponse.json();
        throw new Error(processData.error || "Processing failed");
      }

      setStatus("success");
      setFile(null);

      // Refresh the page to show new statement
      setTimeout(() => {
        router.refresh();
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Statement</CardTitle>
        <CardDescription>
          Drag and drop or select a file to upload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-foreground/30 bg-primary"
              : file
                ? "border-success bg-success/10"
                : "border-border hover:border-foreground/30"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.pdf"
            className="sr-only"
            onChange={handleFileSelect}
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-12 w-12 text-emerald-500" />
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-foreground">Drop your file here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse (CSV or PDF)
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No accounts found. Please create an account first.
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={
            !file ||
            !accountId ||
            status === "uploading" ||
            status === "processing"
          }
          className="w-full"
        >
          {status === "uploading" && (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          )}
          {status === "processing" && (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing transactions...
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Upload complete!
            </>
          )}
          {(status === "idle" || status === "error") && "Upload & Process"}
        </Button>
      </CardContent>
    </Card>
  );
}
