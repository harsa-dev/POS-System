import { BadRequestError } from "@/lib/errors";

type MenuItem = {
  id: string;
  name: string;
  price: number;

  recipes: {
    quantityNeeded: number;

    inventoryItem: {
      id: string;
      currentStock: number;
    };
  }[];
};

type OrderItem = {
  menuItemId?: string;
  quantity: number;
};

type ValidateOrderItemsParams = {
  items: OrderItem[];

  menuItems: MenuItem[];
};

export function validateOrderItems({
  items,
  menuItems,
}: ValidateOrderItemsParams) {
  let subtotal = 0;

  const orderItemsData = items.map((item) => {
    const menuItem = menuItems.find((menu) => menu.id === item.menuItemId);

    if (!menuItem) {
      throw new BadRequestError("Menu item not found");
    }

    if (menuItem.recipes.length === 0) {
      throw new BadRequestError(`${menuItem.name} recipe is not set`);
    }

    if (item.quantity <= 0) {
      throw new BadRequestError("Quantity must be greater than 0");
    }

    for (const recipe of menuItem.recipes) {
      const requiredQuantity = recipe.quantityNeeded * item.quantity;

      if (recipe.inventoryItem.currentStock < requiredQuantity) {
        throw new BadRequestError(`${menuItem.name} is out of stock`);
      }
    }

    const subtotalItem = menuItem.price * item.quantity;

    subtotal += subtotalItem;

    return {
      menuItemId: menuItem.id,

      quantity: item.quantity,

      price: menuItem.price,

      subtotal: subtotalItem,
    };
  });

  return {
    subtotal,
    orderItemsData,
  };
}
