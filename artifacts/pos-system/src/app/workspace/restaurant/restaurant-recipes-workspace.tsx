import { useRef, useState } from "react";
import { toast } from "sonner";

import { RecipesWorkspaceBoard } from "@/app/workspace/restaurant/menu/recipes-workspace-board";
import type { RecipesWorkspaceFormValues } from "@/app/workspace/restaurant/menu/recipes-workspace-board";
import { useRecipesWorkspaceCatalog } from "@/app/workspace/restaurant/menu/use-recipes-workspace-catalog";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import {
  getApiErrorMessage,
  menuApi,
  type RecipePayload,
  type RecipeUpdatePayload,
} from "@/lib/api";

export default function RestaurantRecipesWorkspace() {
  const catalog = useRecipesWorkspaceCatalog();
  const [savingRecipeKey, setSavingRecipeKey] = useState<string | null>(null);
  const savingRecipeKeyRef = useRef<string | null>(null);

  function buildCreateRecipePayload(
    values: RecipesWorkspaceFormValues,
  ): RecipePayload {
    return {
      menuItemId: values.menuItemId,
      inventoryItemId: values.inventoryItemId,
      quantityNeeded: Number(values.quantity),
    };
  }

  function buildUpdateRecipePayload(
    values: RecipesWorkspaceFormValues,
  ): RecipeUpdatePayload {
    return {
      inventoryItemId: values.inventoryItemId,
      quantityNeeded: Number(values.quantity),
    };
  }

  function startSaving(recipeKey: string) {
    if (savingRecipeKeyRef.current !== null) {
      if (import.meta.env.DEV) {
        console.debug("[recipes-v3] duplicate recipe save blocked", {
          activeRecipeKey: savingRecipeKeyRef.current,
          recipeKey,
        });
      }

      return false;
    }

    savingRecipeKeyRef.current = recipeKey;
    setSavingRecipeKey(recipeKey);
    return true;
  }

  function stopSaving() {
    savingRecipeKeyRef.current = null;
    setSavingRecipeKey(null);
  }

  async function handleCreateRecipe(values: RecipesWorkspaceFormValues) {
    if (!startSaving("create")) return false;

    try {
      const result = await menuApi.createRecipeWithResult(
        buildCreateRecipePayload(values),
      );

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message || `Failed to create recipe (${result.status})`,
        );
        return false;
      }

      await catalog.reload();
      toast.success("Recipe ingredient saved.");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create recipe"));
      return false;
    } finally {
      stopSaving();
    }
  }

  async function handleUpdateRecipe(
    recipeId: string,
    values: RecipesWorkspaceFormValues,
  ) {
    if (!startSaving(recipeId)) return false;

    try {
      const result = await menuApi.updateRecipeWithResult(
        recipeId,
        buildUpdateRecipePayload(values),
      );

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message || `Failed to update recipe (${result.status})`,
        );
        return false;
      }

      await catalog.reload();
      toast.success("Recipe ingredient updated.");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update recipe"));
      return false;
    } finally {
      stopSaving();
    }
  }

  return (
    <WorkspaceShell
      title="Restaurant Recipes Workspace"
      description="V3 recipe workspace for reviewing menu ingredient mappings, stock units, and recipe coverage before recipe editing is migrated."
      currentRouteLabel="current Recipes route"
      currentRoutePath={ROUTES.RECIPES}
    >
      <RecipesWorkspaceBoard
        errorMessage={catalog.errorMessage}
        inventoryOptions={catalog.inventoryOptions}
        items={catalog.items}
        menuOptions={catalog.menuOptions}
        onCreateRecipe={handleCreateRecipe}
        onUpdateRecipe={handleUpdateRecipe}
        savingRecipeKey={savingRecipeKey}
        status={catalog.status}
      />
    </WorkspaceShell>
  );
}
