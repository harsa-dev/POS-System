import type { Prisma } from "@prisma/client";

export type CreateBusinessWithProfileInput = {
  name: string;
  ownerId: string;
};

export async function createBusinessWithRestaurantProfile(
  tx: Prisma.TransactionClient,
  input: CreateBusinessWithProfileInput,
) {
  return tx.business.create({
    data: {
      name: input.name,
      ownerId: input.ownerId,
      type: "RESTAURANT",
      mode: "RESTAURANT",
      restaurant: {
        create: {},
      },
    },
    include: {
      restaurant: true,
    },
  });
}
