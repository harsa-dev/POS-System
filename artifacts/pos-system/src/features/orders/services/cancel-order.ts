// features/orders/services/cancel-order.ts

import { prisma } from "@/lib/db/prisma";
import { OrderStatus } from "@prisma/client";

type CancelOrderParams = {
  orderId: string;
};

export async function cancelOrder({ orderId }: CancelOrderParams) {
  const existingOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  if (existingOrder.status === OrderStatus.PAID) {
    throw new Error("Paid order cannot be cancelled");
  }

  return prisma.order.update({
    where: {
      id: orderId,
    },

    data: {
      status: OrderStatus.CANCELLED,
    },
  });
}
