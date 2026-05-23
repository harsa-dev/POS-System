// features/orders/services/update-order-status.ts

import { prisma } from "@/lib/db/prisma";
import { OrderStatus } from "@prisma/client";

type UpdateOrderStatusParams = {
  orderId: string;
  status: OrderStatus;
};

export async function updateOrderStatus({
  orderId,
  status,
}: UpdateOrderStatusParams) {
  const existingOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
    },

    data: {
      status,
    },

    include: {
      items: true,
      table: true,
    },
  });

  return updatedOrder;
}
