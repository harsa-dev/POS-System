import { z } from "zod";

export const createMenuItemSchema = z.object({
  name: z.string().min(2),

  description: z.string().optional(),

  price: z.number().int().positive(),

  imageUrl: z.string().optional(),

  categoryId: z.string().optional(),

  isAvailable: z.boolean().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();