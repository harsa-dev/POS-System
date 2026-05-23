import { z } from "zod";

export const createStockMovementSchema = z.object({
  inventoryItemId: z.string().min(1),

  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),

  quantity: z.number().positive(),

  note: z.string().optional(),

  reason: z.enum([
    "PURCHASE",
    "RECIPE_USAGE",
    "WASTE",
    "EXPIRED",
    "MANUAL_ADJUSTMENT",
    "DAMAGED",
  ]),
});
