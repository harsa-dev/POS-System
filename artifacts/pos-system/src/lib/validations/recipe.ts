import { z } from "zod";

export const createRecipeSchema = z.object({
  menuItemId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  quantityNeeded: z.number().positive(),
});

export const updateRecipeSchema = z.object({
  quantityNeeded: z.number().positive(),
});