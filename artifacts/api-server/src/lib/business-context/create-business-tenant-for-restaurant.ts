import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

export type CreateBusinessTenantForRestaurantInput = {
  restaurantId: string;
  restaurantName: string;
  ownerId: string;
};

function createBusinessId() {
  return `biz_${randomUUID()}`;
}

export async function createBusinessTenantForRestaurant(
  tx: Prisma.TransactionClient,
  input: CreateBusinessTenantForRestaurantInput,
) {
  const businessId = createBusinessId();

  await tx.$executeRawUnsafe(
    `INSERT INTO "Business" ("id", "name", "type", "mode", "ownerId", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, 'RESTAURANT'::"BusinessType", 'RESTAURANT'::"BusinessMode", $3, true, NOW(), NOW())`,
    businessId,
    input.restaurantName,
    input.ownerId,
  );

  await tx.$executeRawUnsafe(
    `UPDATE "Restaurant"
     SET "businessId" = $1
     WHERE "id" = $2`,
    businessId,
    input.restaurantId,
  );

  return businessId;
}
