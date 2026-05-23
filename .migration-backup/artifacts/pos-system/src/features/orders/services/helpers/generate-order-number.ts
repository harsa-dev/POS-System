import { Prisma } from "@prisma/client";

type GenerateOrderNumberParams = {
  tx: Prisma.TransactionClient;

  restaurantId: string;
};

export async function generateOrderNumber({
  tx,
  restaurantId,
}: GenerateOrderNumberParams) {
  const lastOrder = await tx.order.findFirst({
    where: {
      restaurantId,
    },

    orderBy: {
      orderNumber: "desc",
    },

    select: {
      orderNumber: true,
    },
  });

  return (lastOrder?.orderNumber ?? 0) + 1;
}
