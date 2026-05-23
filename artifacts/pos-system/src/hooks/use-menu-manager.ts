"use client";

import {
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";

import type {
  Category,
  InventoryItem,
  MenuItem,
  Recipe,
} from "@/components/menu/menu-types";

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
      const res = await fetch("/api/menu-items", { credentials: "include" });

      const data = await res.json();

      if (data.success) {
        setMenuItems(data.data);
      }
    } catch {
      toast.error(
        "Failed to fetch menu items",
      );
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories", { credentials: "include" });

      const data = await res.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch {
      toast.error(
        "Failed to fetch categories",
      );
    }
  }

  async function fetchInventoryItems() {
    try {
      const res = await fetch(
        "/api/inventory-items",
      );

      const data = await res.json();

      if (data.success) {
        setInventoryItems(data.data);
      }
    } catch {
      toast.error(
        "Failed to fetch inventory items",
      );
    }
  }

  async function fetchRecipes() {
    try {
      const res = await fetch("/api/recipes", { credentials: "include" });

      const data = await res.json();

      if (data.success) {
        setAllRecipes(data.data);
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