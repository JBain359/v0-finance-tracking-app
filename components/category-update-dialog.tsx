"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactionCategorization } from "@/hooks/use-transaction-categorization";
import type { Transaction, Category } from "@/lib/types";

interface CategoryUpdateDialogProps {
  transaction: Transaction;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CategoryUpdateDialog({
  transaction,
  categories,
  open,
  onOpenChange,
  onSuccess,
}: CategoryUpdateDialogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [scope, setScope] = useState<"transaction" | "merchant">("transaction");
  const { updateCategory, isUpdating, error } = useTransactionCategorization();

  const handleSubmit = async () => {
    if (!selectedCategoryId) return;

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    if (!selectedCategory) return;

    try {
      await updateCategory({
        transactionId: transaction.id,
        categoryName: selectedCategory.name,
        categoryId: selectedCategory.id,
        scope,
        merchant: transaction.merchant || undefined,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update category:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Category</DialogTitle>
          <DialogDescription>
            Change the category for this transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon && <span className="mr-2">{category.icon}</span>}
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {transaction.merchant && (
            <div className="space-y-2">
              <Label>Apply to</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transaction" id="transaction" />
                  <Label htmlFor="transaction" className="font-normal">
                    This transaction only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merchant" id="merchant" />
                  <Label htmlFor="merchant" className="font-normal">
                    All transactions from{" "}
                    <span className="font-semibold">{transaction.merchant}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCategoryId || isUpdating}
          >
            {isUpdating ? "Updating..." : "Update Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
