"use client";

import { Trash2 } from "lucide-react";

import type {
  Recipe,
} from "@/components/menu/menu-types";

type RecipeListProps = {
  recipes: Recipe[];

  onDeleteRecipe: (
    id: string,
  ) => void;
};

export function RecipeList({
  recipes,
  onDeleteRecipe,
}: RecipeListProps) {
  return (
    <div className="mt-6 space-y-3">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 p-4"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">
              {
                recipe.inventoryItem
                  .name
              }
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              Uses{" "}
              {
                recipe.quantityNeeded
              }{" "}
              {
                recipe.inventoryItem
                  .unit
              }{" "}
              per item
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onDeleteRecipe(
                recipe.id,
              )
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}