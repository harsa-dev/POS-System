import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadEnvFile();

const { prisma } = await import("../src/lib/prisma.js");

type BusinessSeedTarget = {
  id: string;
  name: string;
  ownerId: string;
};

type RestaurantLegacyColumns = {
  hasName: boolean;
  hasOwnerId: boolean;
};

const RESTAURANT_TENANT_BRIDGE_TABLES = [
  "Category",
  "MenuItem",
  "InventoryItem",
  "DiningTable",
  "Order",
  "CashflowEntry",
  "StockMovement",
  "AuditLog",
  "Shift",
] as const;

function scopedId(businessId: string, seedId: string) {
  return `restaurant-${businessId}-${seedId}`;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function tableExists(tableName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    ) AS "exists"
  `;

  return result[0]?.exists === true;
}

async function columnExists(tableName: string, columnName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS "exists"
  `;

  return result[0]?.exists === true;
}

async function addColumnIfMissing(tableName: string, columnName: string, definition: string) {
  if (!(await tableExists(tableName))) return false;
  if (await columnExists(tableName, columnName)) return false;

  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${quoteIdentifier(tableName)} ADD COLUMN ${quoteIdentifier(columnName)} ${definition}`,
  );

  return true;
}

async function relaxColumnIfPresent(tableName: string, columnName: string) {
  if (!(await tableExists(tableName))) return;
  if (!(await columnExists(tableName, columnName))) return;

  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${quoteIdentifier(tableName)} ALTER COLUMN ${quoteIdentifier(columnName)} DROP NOT NULL`,
  );
}

async function createIndex(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

async function backfillBusinessIdFromRestaurant(tableName: string) {
  if (!(await tableExists(tableName))) return;
  if (!(await columnExists(tableName, "businessId"))) return;
  if (!(await columnExists(tableName, "restaurantId"))) return;

  await prisma.$executeRawUnsafe(`
    UPDATE ${quoteIdentifier(tableName)} AS target
    SET "businessId" = restaurant."businessId"
    FROM "Restaurant" AS restaurant
    WHERE target."businessId" IS NULL
      AND target."restaurantId" = restaurant."id"
  `);
}

async function ensureRestaurantTenantBridgeSchema() {
  const touchedTables: string[] = [];

  for (const tableName of RESTAURANT_TENANT_BRIDGE_TABLES) {
    const added = await addColumnIfMissing(tableName, "businessId", "TEXT");

    if (added) {
      touchedTables.push(tableName);
    }

    await backfillBusinessIdFromRestaurant(tableName);
  }

  await createIndex(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Category_businessId_name_key" ON "Category" ("businessId", "name")',
  );
  await createIndex(
    'CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_businessId_name_key" ON "InventoryItem" ("businessId", "name")',
  );
  await createIndex(
    'CREATE UNIQUE INDEX IF NOT EXISTS "Order_businessId_orderNumber_key" ON "Order" ("businessId", "orderNumber")',
  );

  await createIndex('CREATE INDEX IF NOT EXISTS "MenuItem_businessId_idx" ON "MenuItem" ("businessId")');
  await createIndex('CREATE INDEX IF NOT EXISTS "InventoryItem_businessId_idx" ON "InventoryItem" ("businessId")');
  await createIndex('CREATE INDEX IF NOT EXISTS "DiningTable_businessId_idx" ON "DiningTable" ("businessId")');
  await createIndex('CREATE INDEX IF NOT EXISTS "CashflowEntry_businessId_idx" ON "CashflowEntry" ("businessId")');
  await createIndex('CREATE INDEX IF NOT EXISTS "StockMovement_businessId_idx" ON "StockMovement" ("businessId")');
  await createIndex('CREATE INDEX IF NOT EXISTS "AuditLog_businessId_idx" ON "AuditLog" ("businessId")');
  await createIndex('CREATE INDEX IF NOT EXISTS "Shift_businessId_idx" ON "Shift" ("businessId")');

  if (touchedTables.length > 0) {
    console.log(`Restaurant tenant bridge columns prepared: ${touchedTables.join(", ")}.`);
  } else {
    console.log("Restaurant tenant bridge columns already present.");
  }
}

async function getRestaurantLegacyColumns(): Promise<RestaurantLegacyColumns> {
  const [hasName, hasOwnerId] = await Promise.all([
    columnExists("Restaurant", "name"),
    columnExists("Restaurant", "ownerId"),
  ]);

  return { hasName, hasOwnerId };
}

async function relaxLegacyRestaurantProfileColumns(columns: RestaurantLegacyColumns) {
  if (columns.hasName) {
    await relaxColumnIfPresent("Restaurant", "name");
  }

  if (columns.hasOwnerId) {
    await relaxColumnIfPresent("Restaurant", "ownerId");
  }
}

async function getRestaurantBusinessTargets() {
  return prisma.$queryRaw<BusinessSeedTarget[]>`
    SELECT "id", "name", "ownerId"
    FROM "Business"
    WHERE "mode" = 'RESTAURANT'::"BusinessMode"
      AND "isActive" = TRUE
    ORDER BY "createdAt" ASC
  `;
}

async function ensureLegacyRestaurantProfile(business: BusinessSeedTarget, columns: RestaurantLegacyColumns) {
  if (columns.hasName && columns.hasOwnerId) {
    await prisma.$executeRaw`
      INSERT INTO "Restaurant" (
        "id", "businessId", "name", "ownerId", "address", "phone", "taxRate", "serviceRate", "currency", "orderPrefix", "receiptFooter", "timezone", "qrisEnabled", "cashEnabled", "cardEnabled"
      )
      VALUES (
        ${scopedId(business.id, "profile")},
        ${business.id},
        ${business.name},
        ${business.ownerId},
        'Jl. Demo Restaurant No. 17',
        '+62-812-0000-1717',
        11,
        5,
        'IDR',
        'RST',
        'Thank you for dining with us.',
        'Asia/Jakarta',
        TRUE,
        TRUE,
        TRUE
      )
      ON CONFLICT ("businessId") DO UPDATE SET
        "name" = COALESCE(NULLIF("Restaurant"."name", ''), EXCLUDED."name"),
        "ownerId" = COALESCE("Restaurant"."ownerId", EXCLUDED."ownerId"),
        "address" = EXCLUDED."address",
        "phone" = EXCLUDED."phone",
        "taxRate" = EXCLUDED."taxRate",
        "serviceRate" = EXCLUDED."serviceRate",
        "currency" = EXCLUDED."currency",
        "orderPrefix" = EXCLUDED."orderPrefix",
        "receiptFooter" = EXCLUDED."receiptFooter",
        "timezone" = EXCLUDED."timezone",
        "qrisEnabled" = EXCLUDED."qrisEnabled",
        "cashEnabled" = EXCLUDED."cashEnabled",
        "cardEnabled" = EXCLUDED."cardEnabled"
    `;
    return;
  }

  if (columns.hasName) {
    await prisma.$executeRaw`
      INSERT INTO "Restaurant" (
        "id", "businessId", "name", "address", "phone", "taxRate", "serviceRate", "currency", "orderPrefix", "receiptFooter", "timezone", "qrisEnabled", "cashEnabled", "cardEnabled"
      )
      VALUES (
        ${scopedId(business.id, "profile")},
        ${business.id},
        ${business.name},
        'Jl. Demo Restaurant No. 17',
        '+62-812-0000-1717',
        11,
        5,
        'IDR',
        'RST',
        'Thank you for dining with us.',
        'Asia/Jakarta',
        TRUE,
        TRUE,
        TRUE
      )
      ON CONFLICT ("businessId") DO UPDATE SET
        "name" = COALESCE(NULLIF("Restaurant"."name", ''), EXCLUDED."name"),
        "address" = EXCLUDED."address",
        "phone" = EXCLUDED."phone",
        "taxRate" = EXCLUDED."taxRate",
        "serviceRate" = EXCLUDED."serviceRate",
        "currency" = EXCLUDED."currency",
        "orderPrefix" = EXCLUDED."orderPrefix",
        "receiptFooter" = EXCLUDED."receiptFooter",
        "timezone" = EXCLUDED."timezone",
        "qrisEnabled" = EXCLUDED."qrisEnabled",
        "cashEnabled" = EXCLUDED."cashEnabled",
        "cardEnabled" = EXCLUDED."cardEnabled"
    `;
    return;
  }

  if (columns.hasOwnerId) {
    await prisma.$executeRaw`
      INSERT INTO "Restaurant" (
        "id", "businessId", "ownerId", "address", "phone", "taxRate", "serviceRate", "currency", "orderPrefix", "receiptFooter", "timezone", "qrisEnabled", "cashEnabled", "cardEnabled"
      )
      VALUES (
        ${scopedId(business.id, "profile")},
        ${business.id},
        ${business.ownerId},
        'Jl. Demo Restaurant No. 17',
        '+62-812-0000-1717',
        11,
        5,
        'IDR',
        'RST',
        'Thank you for dining with us.',
        'Asia/Jakarta',
        TRUE,
        TRUE,
        TRUE
      )
      ON CONFLICT ("businessId") DO UPDATE SET
        "ownerId" = COALESCE("Restaurant"."ownerId", EXCLUDED."ownerId"),
        "address" = EXCLUDED."address",
        "phone" = EXCLUDED."phone",
        "taxRate" = EXCLUDED."taxRate",
        "serviceRate" = EXCLUDED."serviceRate",
        "currency" = EXCLUDED."currency",
        "orderPrefix" = EXCLUDED."orderPrefix",
        "receiptFooter" = EXCLUDED."receiptFooter",
        "timezone" = EXCLUDED."timezone",
        "qrisEnabled" = EXCLUDED."qrisEnabled",
        "cashEnabled" = EXCLUDED."cashEnabled",
        "cardEnabled" = EXCLUDED."cardEnabled"
    `;
  }
}

async function main() {
  await ensureRestaurantTenantBridgeSchema();

  const columns = await getRestaurantLegacyColumns();

  if (!columns.hasName && !columns.hasOwnerId) {
    console.log("Restaurant legacy profile columns not found. Compatibility profile preflight skipped.");
    return;
  }

  await relaxLegacyRestaurantProfileColumns(columns);

  const businesses = await getRestaurantBusinessTargets();

  if (businesses.length === 0) {
    console.log("No active RESTAURANT business found. Compatibility profile preflight skipped.");
    return;
  }

  for (const business of businesses) {
    await ensureLegacyRestaurantProfile(business, columns);
  }

  console.log(`Restaurant profile compatibility preflight completed for ${businesses.length} business(es).`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
