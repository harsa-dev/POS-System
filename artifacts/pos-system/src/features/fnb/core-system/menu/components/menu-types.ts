export type Category = {
  id: string;
  name: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
};

export type Recipe = {
  id: string;
  menuItemId: string;
  inventoryItemId: string;
  quantityNeeded: number;
  inventoryItem: InventoryItem;
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  isAvailable?: boolean;
  hasRecipe?: boolean;
  recipeCount?: number;
  availabilityStatus:
  | "AVAILABLE"
  | "OUT_OF_STOCK"
  | "NO_RECIPE"
  | "UNAVAILABLE";
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: {
    name: string;
  } | null;
};

export type ViewMode = "table" | "grid";
