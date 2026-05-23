import { Prisma } from "@prisma/client";

import { BadRequestError } from "@/lib/errors";

type MenuItem = {
  id: string;
  name: string;

  recipes: {
    quantityNeeded: number;

    inventoryItem: {
      id: string;
    };
  }[];
};

type OrderItem = {
  menuItemId?: string;
  quantity: number;
};

type DeductStockParams = {
  tx: Prisma.TransactionClient;

  items: OrderItem[];

  menuItems: MenuItem[];
};

export async function deductStock({ tx, items, menuItems }: DeductStockParams) {
  for (const item of items) {
    const menuItem = menuItems.find((menu) => menu.id === item.menuItemId);

    if (!menuItem) continue;

    for (const recipe of menuItem.recipes) {
      const requiredQuantity = recipe.quantityNeeded * item.quantity;

      const updated = await tx.inventoryItem.updateMany({
        where: {
          id: recipe.inventoryItem.id,

          currentStock: {
            gte: requiredQuantity,
          },
        },

        data: {
          currentStock: {
            decrement: requiredQuantity,
          },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestError(
          `${menuItem.name} stock changed during checkout`,
        );
      }
    }
  }
}
