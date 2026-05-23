// features/orders/types/order.types.ts

import { OrderStatus } from "@prisma/client";

export type OrderTotals = {
  subtotal: number;
  tax: number;
  total: number;
};

export type OrderItemInput = {
  menuItemId: string;
  quantity: number;
};

export type UpdateOrderStatusInput = {
  orderId: string;
  status: OrderStatus;
};