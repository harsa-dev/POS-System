import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { menuApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/format";
import {
  formatRestaurantQuantity,
  menuAvailabilityLabels,
} from "@/app/workspace/restaurant/shared/restaurant-workspace-status";

type RecipesWorkspaceState = "loading" | "ready" | "error";

export type RecipesWorkspaceFilter =
  | "all"
  | "with-recipes"
  | "without-recipes"
  | "unavailable";

export type RecipesWorkspaceIngredient = {
  id: string;
  inventoryItemId: string;
  name: string;
  quantityNeeded: number;
  quantityLabel: string;
  unitLabel: string;
  currentStockLabel: string;
  estimatedCost: number | null;
  estimatedCostLabel: string | null;
};

export type RecipesWorkspaceMenuOption = {
  id: string;
  name: string;
  categoryName: string;
  isAvailable: boolean;
  availabilityLabel: string;
};

export type RecipesWorkspaceInventoryOption = {
  id: string;
  name: string;
  unitLabel: string;
  currentStockLabel: string;
};

export type RecipesWorkspaceMenuItem = {
  id: string;
  name: string;
  categoryName: string;
  isAvailable: boolean;
  availabilityLabel: string;
  recipeCount: number;
  totalEstimatedCostLabel: string | null;
  ingredients: RecipesWorkspaceIngredient[];
};

type RecipesWorkspaceCatalogResult = {
  items: RecipesWorkspaceMenuItem[];
  menuOptions: RecipesWorkspaceMenuOption[];
  inventoryOptions: RecipesWorkspaceInventoryOption[];
  status: RecipesWorkspaceState;
  errorMessage: string | null;
  isRefreshing: boolean;
  reload: () => Promise<void>;
};

type MenuItemResponse = {
  id: string;
  name: string;
  isAvailable?: boolean | null;
  availabilityStatus?: string | null;
  category?: {
    name?: string | null;
  } | null;
};

type RecipeResponse = {
  id: string;
  menuItemId: string;
  inventoryItemId: string;
  quantityNeeded: number;
  menuItem?: MenuItemResponse | null;
  inventoryItem?: {
    id: string;
    name: string;
    unit?: string | null;
    currentStock?: number | null;
    costPerUnit?: number | null;
  } | null;
};

type InventoryItemResponse = {
  id: string;
  name: string;
  unit?: string | null;
  currentStock?: number | null;
};

function getAvailabilityLabel(menuItem: MenuItemResponse) {
  if (menuItem.isAvailable === false) return menuAvailabilityLabels.UNAVAILABLE;
  return (
    menuAvailabilityLabels[
      menuItem.availabilityStatus as keyof typeof menuAvailabilityLabels
    ] ?? menuAvailabilityLabels.AVAILABLE
  );
}

function mapRecipeToIngredient(
  recipe: RecipeResponse,
): RecipesWorkspaceIngredient {
  const unitLabel = recipe.inventoryItem?.unit ?? "-";
  const currentStock = recipe.inventoryItem?.currentStock ?? 0;
  const costPerUnit = recipe.inventoryItem?.costPerUnit ?? null;
  const estimatedCost =
    typeof costPerUnit === "number"
      ? recipe.quantityNeeded * costPerUnit
      : null;

  return {
    id: recipe.id,
    inventoryItemId: recipe.inventoryItemId,
    name: recipe.inventoryItem?.name ?? "Unknown ingredient",
    quantityNeeded: recipe.quantityNeeded,
    quantityLabel: `${formatRestaurantQuantity(recipe.quantityNeeded)} ${unitLabel}`,
    unitLabel,
    currentStockLabel: `${formatRestaurantQuantity(currentStock)} ${unitLabel}`,
    estimatedCost,
    estimatedCostLabel:
      estimatedCost !== null ? formatCurrency(estimatedCost) : null,
  };
}

function mapMenuItemsToRecipeWorkspace(
  menuItems: MenuItemResponse[],
  recipes: RecipeResponse[],
): RecipesWorkspaceMenuItem[] {
  const recipesByMenuItemId = new Map<string, RecipeResponse[]>();

  for (const recipe of recipes) {
    const groupedRecipes = recipesByMenuItemId.get(recipe.menuItemId) ?? [];
    groupedRecipes.push(recipe);
    recipesByMenuItemId.set(recipe.menuItemId, groupedRecipes);
  }

  const menuItemsById = new Map<string, MenuItemResponse>(
    menuItems.map((menuItem) => [menuItem.id, menuItem]),
  );

  for (const recipe of recipes) {
    if (recipe.menuItem && !menuItemsById.has(recipe.menuItem.id)) {
      menuItemsById.set(recipe.menuItem.id, recipe.menuItem);
    }
  }

  return [...menuItemsById.values()]
    .map((menuItem) => {
      const itemRecipes = recipesByMenuItemId.get(menuItem.id) ?? [];
      const ingredients = itemRecipes
        .map(mapRecipeToIngredient)
        .sort((left, right) => left.name.localeCompare(right.name));
      const totalEstimatedCost = ingredients.reduce<number | null>(
        (total, ingredient) => {
          if (ingredient.estimatedCost === null) return total;
          return (total ?? 0) + ingredient.estimatedCost;
        },
        null,
      );

      return {
        id: menuItem.id,
        name: menuItem.name,
        categoryName: menuItem.category?.name ?? "Uncategorized",
        isAvailable: menuItem.isAvailable ?? true,
        availabilityLabel: getAvailabilityLabel(menuItem),
        recipeCount: ingredients.length,
        totalEstimatedCostLabel:
          totalEstimatedCost !== null ? formatCurrency(totalEstimatedCost) : null,
        ingredients,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function mapMenuOptions(
  menuItems: MenuItemResponse[],
): RecipesWorkspaceMenuOption[] {
  return menuItems
    .map((menuItem) => ({
      id: menuItem.id,
      name: menuItem.name,
      categoryName: menuItem.category?.name ?? "Uncategorized",
      isAvailable: menuItem.isAvailable ?? true,
      availabilityLabel: getAvailabilityLabel(menuItem),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function mapInventoryOptions(
  inventoryItems: InventoryItemResponse[],
): RecipesWorkspaceInventoryOption[] {
  return inventoryItems
    .map((item) => {
      const unitLabel = item.unit ?? "-";
      return {
        id: item.id,
        name: item.name,
        unitLabel,
        currentStockLabel: `${formatRestaurantQuantity(item.currentStock ?? 0)} ${unitLabel}`,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Recipe catalog is unavailable.";
}

export function useRecipesWorkspaceCatalog(): RecipesWorkspaceCatalogResult {
  const [items, setItems] = useState<RecipesWorkspaceMenuItem[]>([]);
  const [menuOptions, setMenuOptions] = useState<RecipesWorkspaceMenuOption[]>(
    [],
  );
  const [inventoryOptions, setInventoryOptions] = useState<
    RecipesWorkspaceInventoryOption[]
  >([]);
  const [status, setStatus] = useState<RecipesWorkspaceState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const loadCatalog = useCallback(async () => {
    const isBackgroundRefresh = hasLoadedOnceRef.current;
    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
    }
    setErrorMessage(null);

    try {
      const [menuItemsResponse, recipesResponse, inventoryItemsResponse] =
        await Promise.all([
        menuApi.listMenuItemsWithOptions<MenuItemResponse[]>({
          includeUnavailable: true,
        }),
        menuApi.listRecipes<RecipeResponse[]>(),
        menuApi.listInventoryItems(),
      ]);

      if (!menuItemsResponse.success) {
        throw new Error(menuItemsResponse.message ?? "Failed to load menu");
      }

      if (!recipesResponse.success) {
        throw new Error(recipesResponse.message ?? "Failed to load recipes");
      }

      if (!inventoryItemsResponse.success) {
        throw new Error(
          inventoryItemsResponse.message ?? "Failed to load inventory items",
        );
      }

      setItems(
        mapMenuItemsToRecipeWorkspace(
          menuItemsResponse.data ?? [],
          recipesResponse.data ?? [],
        ),
      );
      setMenuOptions(mapMenuOptions(menuItemsResponse.data ?? []));
      setInventoryOptions(
        mapInventoryOptions(inventoryItemsResponse.data ?? []),
      );
      hasLoadedOnceRef.current = true;
      setStatus("ready");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      if (hasLoadedOnceRef.current) {
        setStatus("ready");
      } else {
        setItems([]);
        setMenuOptions([]);
        setInventoryOptions([]);
        setStatus("error");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return useMemo(
    () => ({
      items,
      menuOptions,
      inventoryOptions,
      status,
      errorMessage,
      isRefreshing,
      reload: loadCatalog,
    }),
    [
      errorMessage,
      inventoryOptions,
      isRefreshing,
      items,
      loadCatalog,
      menuOptions,
      status,
    ],
  );
}
