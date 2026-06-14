"use client";

import type { FormEvent } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import type { Category } from "@/features/restaurant/core-system/menu/components/menu-types";

import { Button } from "@/components/ui/button";

import { Modal } from "@/components/ui/modal";

type CategoryManagerModalProps = {
  open: boolean;
  categories: Category[];
  categoryName: string;
  editingCategoryId: string | null;
  editingCategoryName: string;
  isCategoryLoading: boolean;
  onClose: () => void;
  onCreateCategory: (e: FormEvent<HTMLFormElement>) => void;
  onCategoryNameChange: (value: string) => void;
  onStartEditCategory: (category: Category) => void;
  onCancelEditCategory: () => void;
  onEditingCategoryNameChange: (value: string) => void;
  onSaveCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
};

export function CategoryManagerModal({
  open,
  categories,
  categoryName,
  editingCategoryId,
  editingCategoryName,
  isCategoryLoading,
  onClose,
  onCreateCategory,
  onCategoryNameChange,
  onStartEditCategory,
  onCancelEditCategory,
  onEditingCategoryNameChange,
  onSaveCategory,
  onDeleteCategory,
}: CategoryManagerModalProps) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Categories"
      description="Create, rename, or delete menu categories."
      maxWidth="max-w-xl"
    >
      <form onSubmit={onCreateCategory} className="mt-6 flex gap-3">
        <input
          value={categoryName}
          onChange={(e) => onCategoryNameChange(e.target.value)}
          placeholder="New category name"
          className="h-12 min-w-0 flex-1 rounded-2xl border border-neutral-200 px-4 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
        />

        <Button disabled={isCategoryLoading}>
          {isCategoryLoading ? "Adding..." : "Add"}
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-3"
          >
            {editingCategoryId === category.id ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  value={editingCategoryName}
                  onChange={(e) => onEditingCategoryNameChange(e.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                />

                <button
                  type="button"
                  onClick={() => onSaveCategory(category.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onCancelEditCategory}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900">
                    {category.name}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onStartEditCategory(category)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-100"
                  >
                    <Pencil className="h-4 w-4 text-neutral-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteCategory(category.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-500">
            No categories yet.
          </div>
        )}
      </div>
    </Modal>
  );
}
