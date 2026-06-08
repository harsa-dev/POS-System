import { useCallback, useEffect, useMemo, useState } from "react";

import { menuApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/format";

export type MenuWorkspaceAvailability =
  | "AVAILABLE"
  | "OUT_OF_STOCK"
  | "NO_RECIPE";

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
  imageUrl: string | null;
};

type MenuWorkspaceState = "loading" | "ready" | "error";

type MenuWorkspaceCatalogResult = {
  items: MenuWorkspaceItem[];
  categories: MenuWorkspaceCategory[];
  status: MenuWorkspaceState;
  errorMessage: string | null;
  reload: () => Promise<void>;
};

type MenuItemResponse = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  availabilityStatus?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: {
    id?: string | null;
    name?: string | null;
  } | null;
};

type CategoryResponse = {
  id: string;
  name: string;
};

const availabilityLabels: Record<MenuWorkspaceAvailability, string> = {
  AVAILABLE: "Available",
  OUT_OF_STOCK: "Out of Stock",
  NO_RECIPE: "No Recipe",
};

function normalizeAvailability(
  availabilityStatus?: string | null,
): MenuWorkspaceAvailability {
  if (
    availabilityStatus === "AVAILABLE" ||
    availabilityStatus === "OUT_OF_STOCK" ||
    availabilityStatus === "NO_RECIPE"
  ) {
    return availabilityStatus;
  }

  return "NO_RECIPE";
}

function mapMenuItemToWorkspaceItem(
  menuItem: MenuItemResponse,
): MenuWorkspaceItem {
  const availability = normalizeAvailability(menuItem.availabilityStatus);

  return {
    id: menuItem.id,
    name: menuItem.name,
    description: menuItem.description?.trim() || "No description yet.",
    categoryId: menuItem.categoryId ?? menuItem.category?.id ?? null,
    categoryName: menuItem.category?.name ?? "Uncategorized",
    price: menuItem.price,
    priceLabel: formatCurrency(menuItem.price),
    availability,
    availabilityLabel: availabilityLabels[availability],
    imageUrl: menuItem.imageUrl ?? null,
  };
}

function mapCategories(
  categories: CategoryResponse[],
  items: MenuWorkspaceItem[],
): MenuWorkspaceCategory[] {
  const categoryCounts = new Map<string, number>();

  for (const item of items) {
    if (!item.categoryId) continue;
    categoryCounts.set(
      item.categoryId,
      (categoryCounts.get(item.categoryId) ?? 0) + 1,
    );
  }

  const mappedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    itemCount: categoryCounts.get(category.id) ?? 0,
  }));

  const uncategorizedCount = items.filter((item) => item.categoryId === null)
    .length;

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
  return "Menu catalog is unavailable.";
}

export function useMenuWorkspaceCatalog(): MenuWorkspaceCatalogResult {
  const [items, setItems] = useState<MenuWorkspaceItem[]>([]);
  const [categories, setCategories] = useState<MenuWorkspaceCategory[]>([]);
  const [status, setStatus] = useState<MenuWorkspaceState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const [menuItemsResponse, categoriesResponse] = await Promise.all([
        menuApi.listMenuItems(),
        menuApi.listCategories(),
      ]);

      if (!menuItemsResponse.success) {
        throw new Error(menuItemsResponse.message ?? "Failed to load menu");
      }

      if (!categoriesResponse.success) {
        throw new Error(categoriesResponse.message ?? "Failed to load categories");
      }

      const mappedItems = (menuItemsResponse.data ?? [])
        .map(mapMenuItemToWorkspaceItem)
        .sort((left, right) => left.name.localeCompare(right.name));
      const mappedCategories = mapCategories(
        categoriesResponse.data ?? [],
        mappedItems,
      );

      setItems(mappedItems);
      setCategories(mappedCategories);
      setStatus("ready");
    } catch (error) {
      setItems([]);
      setCategories([]);
      setErrorMessage(getErrorMessage(error));
      setStatus("error");
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
      reload: loadCatalog,
    }),
    [categories, errorMessage, items, loadCatalog, status],
  );
}
