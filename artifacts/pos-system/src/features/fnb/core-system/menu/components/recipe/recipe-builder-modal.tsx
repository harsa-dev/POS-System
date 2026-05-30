"use client";

import type { FormEvent } from "react";
import { Trash2, Utensils, X } from "lucide-react";

import type {
  InventoryItem,
  MenuItem,
  Recipe,
} from "@/features/fnb/core-system/menu/components/menu-types";
import { RecipeForm } from "@/features/fnb/core-system/menu/components/recipe/recipe-form";

import { RecipeList } from "@/features/fnb/core-system/menu/components/recipe/recipe-list";

import { RecipeEmptyState } from "@/features/fnb/core-system/menu/components/recipe/recipe-empty-state";

import { Modal } from "@/components/ui/modal";

type RecipeBuilderModalProps = {
  open: boolean;
  selectedMenuItem: MenuItem | null;
  recipes: Recipe[];
  inventoryItems: InventoryItem[];
  recipeInventoryItemId: string;
  recipeQuantityNeeded: string;
  isRecipeLoading: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onDeleteRecipe: (id: string) => void;
  onInventoryItemChange: (value: string) => void;
  onQuantityNeededChange: (value: string) => void;
};

export function RecipeBuilderModal({
  open,
  selectedMenuItem,
  recipes,
  inventoryItems,
  recipeInventoryItemId,
  recipeQuantityNeeded,
  isRecipeLoading,
  onClose,
  onSubmit,
  onDeleteRecipe,
  onInventoryItemChange,
  onQuantityNeededChange,
}: RecipeBuilderModalProps) {
if (!selectedMenuItem) return null;

  return (
  <Modal
    open={open}
    onClose={onClose}
    title="Recipe Builder"
    description={selectedMenuItem.name}
    maxWidth="max-w-2xl"
  >
        <RecipeForm
          inventoryItems={inventoryItems}
          recipeInventoryItemId={recipeInventoryItemId}
          recipeQuantityNeeded={recipeQuantityNeeded}
          isRecipeLoading={isRecipeLoading}
          onSubmit={onSubmit}
          onInventoryItemChange={onInventoryItemChange}
          onQuantityNeededChange={onQuantityNeededChange}
        />

        {recipes.length > 0 ? (
          <RecipeList recipes={recipes} onDeleteRecipe={onDeleteRecipe} />
        ) : (
          <RecipeEmptyState />
        )}
    </Modal>
  );
}
