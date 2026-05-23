// features/orders/schemas/create-order.schema.ts

import { z } from "zod";

export const createOrderItemSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),

  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

export const createOrderSchema = z.object({
  tableId: z.string().optional(),

  notes: z.string().max(500, "Notes is too long").optional(),

  items: z
    .array(createOrderItemSchema)
    .min(1, "Order must contain at least one item"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
