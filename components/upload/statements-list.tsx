"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Trash2, Loader2, AlertTriangle } from "lucide-react";
import type { Statement } from "@/lib/types";

interface StatementsListProps {
  statements: Statement[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StatementsList({ statements }: StatementsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<Statement | null>(
    null,
  );

  const openDeleteDialog = (statement: Statement) => {
    setStatementToDelete(statement);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!statementToDelete) return;

    setDeletingId(statementToDelete.id);
    setDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/statements/${statementToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete statement:", error);
    } finally {
      setDeletingId(null);
      setStatementToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Statements</CardTitle>
          <CardDescription>
            {statements.length} statement{statements.length !== 1 ? "s" : ""}{" "}
            uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length > 0 ? (
            <div className="space-y-3">
              {statements.map((statement) => (
                <div
                  key={statement.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary border-2 border-foreground/20">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground line-clamp-1">
                        {statement.filename}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(statement.uploaded_at)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {statement.source_type === "credit_card"
                            ? "Credit Card"
                            : "Bank"}
                        </Badge>
                        {statement.processed && (
                          <Badge variant="outline" className="text-xs">
                            {statement.row_count} transactions
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(statement)}
                    disabled={deletingId === statement.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === statement.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <p>No statements uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Statement?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {statementToDelete?.filename}
              </span>
              ?
              <br />
              <br />
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {statementToDelete?.row_count || 0} transaction
                {statementToDelete?.row_count !== 1 ? "s" : ""}
              </span>{" "}
              associated with this statement. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Statement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
