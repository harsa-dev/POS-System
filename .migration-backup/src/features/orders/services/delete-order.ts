// features/orders/services/delete-order.ts

import { prisma } from "@/lib/db/prisma";

type DeleteOrderParams = {
  orderId: string;
};

export async function deleteOrder({ orderId }: DeleteOrderParams) {
  const existingOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  await prisma.orderItem.deleteMany({
    where: {
      orderId,
    },
  });

  return prisma.order.delete({
    where: {
      id: orderId,
    },
  });
}
