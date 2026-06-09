import { useEffect, useMemo, useState } from "react";

import {
  v3PosCategories,
  v3PosProducts,
} from "@/app/workspace/restaurant/pos-placeholder-data";
import type {
  PosCategoryItem,
  PosProductItem,
} from "@/app/workspace/restaurant/pos/pos-workspace-types";
import { menuApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/format";

type MenuCatalogStatus = "loading" | "ready" | "error";

type MenuCatalogState = {
  products: PosProductItem[];
  categories: PosCategoryItem[];
  status: MenuCatalogStatus;
  errorMessage: string | null;
  isUsingFallback: boolean;
};

type MenuItemResponse = Awaited<ReturnType<typeof menuApi.listMenuItems>>;
type MenuItem = NonNullable<MenuItemResponse["data"]>[number];

type CategoryResponse = Awaited<ReturnType<typeof menuApi.listCategories>>;
type Category = NonNullable<CategoryResponse["data"]>[number];

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

function getProductStatus(menuItem: MenuItem) {
  if (menuItem.availabilityStatus === "AVAILABLE") return "Ready";
  if (menuItem.availabilityStatus === "OUT_OF_STOCK") return "Out";
  return "Recipe";
}

function mapMenuItemToProduct(menuItem: MenuItem): PosProductItem {
  return {
    id: menuItem.id,
    name: menuItem.name,
    category: menuItem.category?.name ?? "Uncategorized",
    price: formatCurrency(menuItem.price),
    priceValue: menuItem.price,
    status: getProductStatus(menuItem),
    imageUrl: menuItem.imageUrl,
  };
}

function isSellableMenuItem(menuItem: MenuItem) {
  return menuItem.isAvailable !== false && menuItem.hasRecipe !== false;
}

function mapCategories(
  categories: Category[],
  products: PosProductItem[],
): PosCategoryItem[] {
  const categoryCounts = new Map<string, number>();

  for (const product of products) {
    categoryCounts.set(
      product.category,
      (categoryCounts.get(product.category) ?? 0) + 1,
    );
  }

  const mappedCategories = categories.map((category) => ({
    label: category.name,
    count: categoryCounts.get(category.name) ?? 0,
    tone: "bg-white text-neutral-700",
  }));

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
  return "Menu catalog is unavailable. Showing static preview data.";
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
        const [menuItemsResponse, categoriesResponse] = await Promise.all([
          menuApi.listMenuItems(),
          menuApi.listCategories(),
        ]);
        if (!isMounted) return;

        if (!menuItemsResponse.success) {
          throw new Error(menuItemsResponse.message ?? "Failed to load menu");
        }

        if (!categoriesResponse.success) {
          throw new Error(
            categoriesResponse.message ?? "Failed to load categories",
          );
        }

        const menuItems = (menuItemsResponse.data ?? []).filter(
          isSellableMenuItem,
        );
        const categoryData = categoriesResponse.data ?? [];
        const mappedProducts = menuItems.map(mapMenuItemToProduct);

        setProducts(mappedProducts);
        setCategories(mapCategories(categoryData, mappedProducts));
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
