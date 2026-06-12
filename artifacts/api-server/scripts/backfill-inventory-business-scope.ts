import { prisma } from "../src/lib/prisma.js";

type InventoryBackfillRow = {
  inventoryItemId: string;
  restaurantId: string;
  businessId: string | null;
};

type StockMovementBackfillRow = {
  movementId: string;
  inventoryItemId: string;
  restaurantId: string;
  businessId: string | null;
  costPerUnit: number;
};

async function backfillInventoryItems() {
  const rows = await prisma.$queryRawUnsafe<InventoryBackfillRow[]>(
    `SELECT ii."id" AS "inventoryItemId",
            ii."restaurantId" AS "restaurantId",
            r."businessId" AS "businessId"
     FROM "InventoryItem" ii
     INNER JOIN "Restaurant" r ON r."id" = ii."restaurantId"
     WHERE ii."businessId" IS NULL
       AND r."businessId" IS NOT NULL`,
  );

  if (rows.length === 0) {
    console.info("No inventory items need business scope backfill.");
    return 0;
  }

  console.info(`Backfilling ${rows.length} inventory item(s) with business scope...`);

  let updated = 0;

  for (const row of rows) {
    if (!row.businessId) continue;

    await prisma.inventoryItem.updateMany({
      where: {
        id: row.inventoryItemId,
        restaurantId: row.restaurantId,
        businessId: null,
      },
      data: {
        businessId: row.businessId,
      },
    });

    updated += 1;
  }

  console.info(`Inventory item business scope backfill finished. Updated ${updated} row(s).`);
  return updated;
}

async function backfillStockMovements() {
  const rows = await prisma.$queryRawUnsafe<StockMovementBackfillRow[]>(
    `SELECT sm."id" AS "movementId",
            ii."id" AS "inventoryItemId",
            ii."restaurantId" AS "restaurantId",
            ii."businessId" AS "businessId",
            ii."costPerUnit" AS "costPerUnit"
     FROM "StockMovement" sm
     INNER JOIN "InventoryItem" ii ON ii."id" = sm."inventoryItemId"
     WHERE sm."businessId" IS NULL
        OR sm."restaurantId" IS NULL
        OR sm."unitCostSnapshot" IS NULL`,
  );

  if (rows.length === 0) {
    console.info("No stock movements need inventory business scope backfill.");
    return 0;
  }

  console.info(`Backfilling ${rows.length} stock movement(s) with inventory scope snapshots...`);

  let updated = 0;

  for (const row of rows) {
    await prisma.stockMovement.updateMany({
      where: { id: row.movementId },
      data: {
        businessId: row.businessId,
        restaurantId: row.restaurantId,
        unitCostSnapshot: row.costPerUnit,
        sourceType: "SYSTEM",
      },
    });

    updated += 1;
  }

  console.info(`Stock movement business scope backfill finished. Updated ${updated} row(s).`);
  return updated;
}

async function main() {
  console.info("Starting inventory business scope backfill...");

  const inventoryItemCount = await backfillInventoryItems();
  const stockMovementCount = await backfillStockMovements();

  console.info(
    `Inventory business scope backfill complete. Inventory items: ${inventoryItemCount}, stock movements: ${stockMovementCount}.`,
  );
}

main()
  .catch((error) => {
    console.error("Inventory business scope backfill failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
