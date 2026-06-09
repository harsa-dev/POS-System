import { useRef, useState } from "react";
import { toast } from "sonner";

import { RecipesWorkspaceBoard } from "@/app/workspace/restaurant/menu/recipes-workspace-board";
import type {
  RecipesWorkspaceActionState,
  RecipesWorkspaceFormValues,
} from "@/app/workspace/restaurant/menu/recipes-workspace-board";
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
  const [activeRecipeAction, setActiveRecipeAction] =
    useState<RecipesWorkspaceActionState>(null);
  const activeRecipeActionRef = useRef<RecipesWorkspaceActionState>(null);

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

  function startRecipeAction(
    recipeKey: string,
    type: NonNullable<RecipesWorkspaceActionState>["type"],
  ) {
    if (activeRecipeActionRef.current !== null) {
      if (import.meta.env.DEV) {
        console.debug("[recipes-v3] duplicate recipe action blocked", {
          activeRecipeAction: activeRecipeActionRef.current,
          recipeKey,
          type,
        });
      }

      return false;
    }

    const nextAction = { key: recipeKey, type };
    activeRecipeActionRef.current = nextAction;
    setActiveRecipeAction(nextAction);
    return true;
  }

  function stopRecipeAction() {
    activeRecipeActionRef.current = null;
    setActiveRecipeAction(null);
  }

  async function handleCreateRecipe(values: RecipesWorkspaceFormValues) {
    if (!startRecipeAction("create", "save")) return false;

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
      stopRecipeAction();
    }
  }

  async function handleUpdateRecipe(
    recipeId: string,
    values: RecipesWorkspaceFormValues,
  ) {
    if (!startRecipeAction(recipeId, "save")) return false;

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
      stopRecipeAction();
    }
  }

  async function handleDeleteRecipe(recipeId: string) {
    if (!startRecipeAction(recipeId, "delete")) return false;

    try {
      const result = await menuApi.deleteRecipeWithResult(recipeId);

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message || `Failed to remove ingredient (${result.status})`,
        );
        return false;
      }

      await catalog.reload();
      toast.success("Recipe ingredient removed.");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove ingredient"));
      return false;
    } finally {
      stopRecipeAction();
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
        activeRecipeAction={activeRecipeAction}
        errorMessage={catalog.errorMessage}
        inventoryOptions={catalog.inventoryOptions}
        isRefreshing={catalog.isRefreshing}
        items={catalog.items}
        menuOptions={catalog.menuOptions}
        onCreateRecipe={handleCreateRecipe}
        onDeleteRecipe={handleDeleteRecipe}
        onUpdateRecipe={handleUpdateRecipe}
        status={catalog.status}
      />
    </WorkspaceShell>
  );
}
