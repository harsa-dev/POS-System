"use client";

import {
  useEffect,
  useState,
} from "react";
import { menuApi } from "@/lib/api";

import { toast } from "sonner";

import type {
  Category,
  InventoryItem,
  MenuItem,
  Recipe,
} from "@/features/restaurant/core-system/menu/components/menu-types";

export function useMenuManager() {
  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [inventoryItems, setInventoryItems] =
    useState<InventoryItem[]>([]);

  const [allRecipes, setAllRecipes] =
    useState<Recipe[]>([]);

  async function fetchMenuItems() {
    try {
      const data = await menuApi.listMenuItemsWithOptions<MenuItem[]>({
        includeUnavailable: true,
      });

      if (data.success) {
        setMenuItems(data.data ?? []);
      }
    } catch {
      toast.error(
        "Failed to fetch menu items",
      );
    }
  }

  async function fetchCategories() {
    try {
      const data = await menuApi.listCategories();

      if (data.success) {
        setCategories(data.data ?? []);
      }
    } catch {
      toast.error(
        "Failed to fetch categories",
      );
    }
  }

  async function fetchInventoryItems() {
    try {
      const data = await menuApi.listInventoryItems();

      if (data.success) {
        setInventoryItems(data.data ?? []);
      }
    } catch {
      toast.error(
        "Failed to fetch inventory items",
      );
    }
  }

  async function fetchRecipes() {
    try {
      const data = await menuApi.listRecipes();

      if (data.success) {
        setAllRecipes(data.data ?? []);
      }
    } catch {
      toast.error(
        "Failed to fetch recipes",
      );
    }
  }

  function hasRecipe(
    menuItemId: string,
  ) {
    return allRecipes.some(
      (recipe) =>
        recipe.menuItemId === menuItemId,
    );
  }

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchInventoryItems();
    fetchRecipes();
  }, []);

  return {
    menuItems,
    categories,
    inventoryItems,
    allRecipes,

    fetchMenuItems,
    fetchCategories,
    fetchInventoryItems,
    fetchRecipes,

    hasRecipe,
  };
}
