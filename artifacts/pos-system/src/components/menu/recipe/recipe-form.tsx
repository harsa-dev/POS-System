"use client";

import type { FormEvent } from "react";

import type {
  InventoryItem,
} from "@/components/menu/menu-types";

type RecipeFormProps = {
  inventoryItems: InventoryItem[];

  recipeInventoryItemId: string;

  recipeQuantityNeeded: string;

  isRecipeLoading: boolean;

  onSubmit: (
    e: FormEvent<HTMLFormElement>,
  ) => void;

  onInventoryItemChange: (
    value: string,
  ) => void;

  onQuantityNeededChange: (
    value: string,
  ) => void;
};

export function RecipeForm({
  inventoryItems,
  recipeInventoryItemId,
  recipeQuantityNeeded,
  isRecipeLoading,
  onSubmit,
  onInventoryItemChange,
  onQuantityNeededChange,
}: RecipeFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 grid gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[1fr_160px_auto]"
    >
      <select
        required
        value={recipeInventoryItemId}
        onChange={(e) =>
          onInventoryItemChange(
            e.target.value,
          )
        }
        className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
      >
        <option value="">
          Select inventory item
        </option>

        {inventoryItems.map((item) => (
          <option
            key={item.id}
            value={item.id}
          >
            {item.name} ({item.unit})
          </option>
        ))}
      </select>

      <input
        required
        type="number"
        min={0}
        step="0.01"
        value={recipeQuantityNeeded}
        onChange={(e) =>
          onQuantityNeededChange(
            e.target.value,
          )
        }
        placeholder="Qty"
        className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none"
      />

      <button
        disabled={isRecipeLoading}
        className="h-12 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
      >
        {isRecipeLoading
          ? "Saving..."
          : "Add"}
      </button>
    </form>
  );
}