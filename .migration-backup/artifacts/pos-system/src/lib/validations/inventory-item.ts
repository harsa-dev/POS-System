import { z } from "zod";

export const createInventoryItemSchema = z.object({
  name: z.string().min(2),

  sku: z.string().optional(),

  type: z.enum(["INGREDIENT", "PACKAGING", "EQUIPMENT"]),

  unit: z.enum(["PCS", "GRAM", "KILOGRAM", "LITER", "ML", "PACK", "BOTTLE"]),

  currentStock: z.number().min(0).optional(),

  minimumStock: z.number().min(0).optional(),

  costPerUnit: z.number().int().min(0).optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();