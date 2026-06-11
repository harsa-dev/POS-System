import { randomUUID } from "node:crypto";

import { prisma } from "../src/lib/prisma.js";

type RestaurantWithoutBusiness = {
  id: string;
  name: string;
  ownerId: string;
  businessId: string | null;
};

function createBusinessId() {
  return `biz_${randomUUID()}`;
}

async function main() {
  const restaurants = await prisma.$queryRawUnsafe<RestaurantWithoutBusiness[]>(
    `SELECT "id", "name", "ownerId", "businessId"
     FROM "Restaurant"
     WHERE "businessId" IS NULL`,
  );

  if (restaurants.length === 0) {
    console.info("No restaurants need business tenant backfill.");
    return;
  }

  console.info(`Backfilling ${restaurants.length} restaurant(s) into Business tenants...`);

  for (const restaurant of restaurants) {
    const businessId = createBusinessId();

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO "Business" ("id", "name", "type", "mode", "ownerId", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, 'RESTAURANT'::"BusinessType", 'RESTAURANT'::"BusinessMode", $3, true, NOW(), NOW())`,
        businessId,
        restaurant.name,
        restaurant.ownerId,
      );

      await tx.$executeRawUnsafe(
        `UPDATE "Restaurant"
         SET "businessId" = $1
         WHERE "id" = $2 AND "businessId" IS NULL`,
        businessId,
        restaurant.id,
      );
    });

    console.info(`Backfilled restaurant ${restaurant.id} -> business ${businessId}`);
  }

  console.info("Business tenant backfill finished.");
}

main()
  .catch((error) => {
    console.error("Business tenant backfill failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
