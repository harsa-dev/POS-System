import { useEffect, useMemo, useState } from "react";

import {
  v3PosCategories,
  v3PosProducts,
} from "@/app/workspace/restaurant/pos-placeholder-data";
import type {
  PosCategoryItem,
  PosProductItem,
} from "@/app/workspace/restaurant/pos/pos-workspace-types";
import { restaurantApi, type RestaurantMenuItemDto } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/format";

type MenuCatalogStatus = "loading" | "ready" | "error";

type MenuCatalogState = {
  products: PosProductItem[];
  categories: PosCategoryItem[];
  status: MenuCatalogStatus;
  errorMessage: string | null;
  isUsingFallback: boolean;
};

const fallbackProducts: PosProductItem[] = v3PosProducts.map(
  (product, index) => ({
    id: `fallback-product-${index}`,
    name: product.name,
    category: product.category,
    price: product.price,
    priceValue: product.priceValue,
    status: product.status,
    imageUrl: product.imageUrl,
  }),
);

const fallbackCategories: PosCategoryItem[] = v3PosCategories.map(
  (category) => ({
    label: category.label,
    count: category.count,
    tone: category.tone,
  }),
);

function getProductStatus(menuItem: RestaurantMenuItemDto) {
  if (!menuItem.isAvailable) return "Out";
  if (menuItem.recipeIngredients.length === 0) return "Recipe";

  const hasStockRisk = menuItem.recipeIngredients.some(
    (ingredient) => ingredient.currentStock < ingredient.quantityNeeded,
  );

  return hasStockRisk ? "Out" : "Ready";
}

function mapMenuItemToProduct(menuItem: RestaurantMenuItemDto): PosProductItem {
  return {
    id: menuItem.id,
    name: menuItem.name,
    category: menuItem.category?.name ?? "Uncategorized",
    price: formatCurrency(menuItem.price),
    priceValue: menuItem.price,
    status: getProductStatus(menuItem),
    imageUrl: menuItem.imageUrl ?? "",
  };
}

function isSellableMenuItem(menuItem: RestaurantMenuItemDto) {
  if (menuItem.isAvailable === false) return false;
  if (menuItem.recipeIngredients.length === 0) return false;

  return menuItem.recipeIngredients.every(
    (ingredient) => ingredient.currentStock >= ingredient.quantityNeeded,
  );
}

function mapCategories(products: PosProductItem[]): PosCategoryItem[] {
  const categoryCounts = new Map<string, number>();

  for (const product of products) {
    categoryCounts.set(
      product.category,
      (categoryCounts.get(product.category) ?? 0) + 1,
    );
  }

  const mappedCategories = Array.from(categoryCounts.entries())
    .map(([label, count]) => ({
      label,
      count,
      tone: "bg-white text-neutral-700",
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return [
    {
      label: "All Items",
      count: products.length,
      tone: "bg-neutral-950 text-white",
    },
    ...mappedCategories,
  ];
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Restaurant menu catalog is unavailable. Showing static preview data.";
}

export function usePosMenuCatalog(): MenuCatalogState {
  const [products, setProducts] = useState<PosProductItem[]>(fallbackProducts);
  const [categories, setCategories] =
    useState<PosCategoryItem[]>(fallbackCategories);
  const [status, setStatus] = useState<MenuCatalogStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await restaurantApi.listMenuItems();
        if (!isMounted) return;

        if (!response.success) {
          throw new Error(response.message ?? "Failed to load restaurant menu");
        }

        const menuItems = (response.data ?? []).filter(isSellableMenuItem);
        const mappedProducts = menuItems.map(mapMenuItemToProduct);

        setProducts(mappedProducts);
        setCategories(mapCategories(mappedProducts));
        setIsUsingFallback(false);

        setStatus("ready");
      } catch (error) {
        if (!isMounted) return;

        setProducts(fallbackProducts);
        setCategories(fallbackCategories);
        setIsUsingFallback(true);
        setErrorMessage(getErrorMessage(error));
        setStatus("error");
      }
    }

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(
    () => ({
      products,
      categories,
      status,
      errorMessage,
      isUsingFallback,
    }),
    [categories, errorMessage, isUsingFallback, products, status],
  );
}
