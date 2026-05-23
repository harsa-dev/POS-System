// features/orders/services/get-orders.ts

import { prisma } from "@/lib/db/prisma";
import { OrderStatus } from "@prisma/client";

type GetOrdersParams = {
  restaurantId: string;
  status?: OrderStatus;
};

export async function getOrders({ restaurantId, status }: GetOrdersParams) {
  return prisma.order.findMany({
    where: {
      restaurantId,
      ...(status && { status }),
    },

    include: {
      items: {
        include: {
          menuItem: true,
        },
      },

      table: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}
