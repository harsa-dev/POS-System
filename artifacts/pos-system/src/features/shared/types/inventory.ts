export type InventoryMode =
  | "Finished Products"
  | "Semi-Finished Products"
  | "Raw Materials";

export type InventoryItem = {
  productName: string;
  sku: string;
  mode: InventoryMode;
  category: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  threshold: number;
};

export type InventoryStockStatus = "In Stock" | "Low Stock" | "Out of Stock";
