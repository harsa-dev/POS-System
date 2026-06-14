import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { restaurantApi, type RestaurantMenuItemDto } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/format";
import {
  menuAvailabilityLabels,
  normalizeMenuAvailabilityStatus,
  type MenuAvailabilityStatus,
} from "@/app/workspace/restaurant/shared/restaurant-workspace-status";

export type MenuWorkspaceAvailability = MenuAvailabilityStatus;

export type MenuWorkspaceCategory = {
  id: string;
  name: string;
  itemCount: number;
};

export type MenuWorkspaceItem = {
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  categoryName: string;
  price: number;
  priceLabel: string;
  availability: MenuWorkspaceAvailability;
  availabilityLabel: string;
  isAvailable: boolean;
  hasRecipe: boolean;
  recipeCount: number;
  isSellable: boolean;
  imageUrl: string | null;
};

type MenuWorkspaceState = "loading" | "ready" | "error";

type MenuWorkspaceCatalogResult = {
  items: MenuWorkspaceItem[];
  categories: MenuWorkspaceCategory[];
  status: MenuWorkspaceState;
  errorMessage: string | null;
  isRefreshing: boolean;
  reload: () => Promise<void>;
};

type CategoryBucket = {
  id: string;
  name: string;
};

function getRecipeAvailability(menuItem: RestaurantMenuItemDto) {
  if (!menuItem.isAvailable) return "UNAVAILABLE";
  if (menuItem.recipeIngredients.length === 0) return "NO_RECIPE";

  const hasStockRisk = menuItem.recipeIngredients.some(
    (ingredient) => ingredient.currentStock < ingredient.quantityNeeded,
  );

  return hasStockRisk ? "OUT_OF_STOCK" : "AVAILABLE";
}

function mapMenuItemToWorkspaceItem(
  menuItem: RestaurantMenuItemDto,
): MenuWorkspaceItem {
  const recipeCount = menuItem.recipeIngredients.length;
  const hasRecipe = recipeCount > 0;
  const availability = normalizeMenuAvailabilityStatus(
    getRecipeAvailability(menuItem),
  );

  return {
    id: menuItem.id,
    name: menuItem.name,
    description: menuItem.description?.trim() || "No description yet.",
    categoryId: menuItem.category?.id ?? null,
    categoryName: menuItem.category?.name ?? "Uncategorized",
    price: menuItem.price,
    priceLabel: formatCurrency(menuItem.price),
    availability,
    availabilityLabel: menuAvailabilityLabels[availability],
    isAvailable: menuItem.isAvailable,
    hasRecipe,
    recipeCount,
    isSellable: menuItem.isAvailable && availability === "AVAILABLE",
    imageUrl: menuItem.imageUrl ?? null,
  };
}

function mapCategories(items: MenuWorkspaceItem[]): MenuWorkspaceCategory[] {
  const categoryBuckets = new Map<string, CategoryBucket>();
  const categoryCounts = new Map<string, number>();
  let uncategorizedCount = 0;

  for (const item of items) {
    if (!item.categoryId) {
      uncategorizedCount += 1;
      continue;
    }

    categoryBuckets.set(item.categoryId, {
      id: item.categoryId,
      name: item.categoryName,
    });
    categoryCounts.set(
      item.categoryId,
      (categoryCounts.get(item.categoryId) ?? 0) + 1,
    );
  }

  const mappedCategories = Array.from(categoryBuckets.values()).map(
    (category) => ({
      id: category.id,
      name: category.name,
      itemCount: categoryCounts.get(category.id) ?? 0,
    }),
  );

  if (uncategorizedCount > 0) {
    mappedCategories.push({
      id: "uncategorized",
      name: "Uncategorized",
      itemCount: uncategorizedCount,
    });
  }

  return mappedCategories.sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Restaurant menu catalog is unavailable.";
}

export function useMenuWorkspaceCatalog(): MenuWorkspaceCatalogResult {
  const [items, setItems] = useState<MenuWorkspaceItem[]>([]);
  const [categories, setCategories] = useState<MenuWorkspaceCategory[]>([]);
  const [status, setStatus] = useState<MenuWorkspaceState>("loading");
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
      const response = await restaurantApi.listMenuItems();

      if (!response.success) {
        throw new Error(response.message ?? "Failed to load restaurant menu");
      }

      const mappedItems = (response.data ?? [])
        .map(mapMenuItemToWorkspaceItem)
        .sort((left, right) => left.name.localeCompare(right.name));
      const mappedCategories = mapCategories(mappedItems);

      setItems(mappedItems);
      setCategories(mappedCategories);
      hasLoadedOnceRef.current = true;
      setStatus("ready");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      if (hasLoadedOnceRef.current) {
        setStatus("ready");
      } else {
        setItems([]);
        setCategories([]);
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
      categories,
      status,
      errorMessage,
      isRefreshing,
      reload: loadCatalog,
    }),
    [categories, errorMessage, isRefreshing, items, loadCatalog, status],
  );
}
