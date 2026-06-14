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

function scopedId(businessId: string, seedId: string) {
  return `restaurant-${businessId}-${seedId}`;
}

async function hasRestaurantColumn(columnName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Restaurant'
        AND column_name = ${columnName}
    ) AS "exists"
  `;

  return result[0]?.exists === true;
}

async function getRestaurantLegacyColumns(): Promise<RestaurantLegacyColumns> {
  const [hasName, hasOwnerId] = await Promise.all([
    hasRestaurantColumn("name"),
    hasRestaurantColumn("ownerId"),
  ]);

  return { hasName, hasOwnerId };
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
  const columns = await getRestaurantLegacyColumns();

  if (!columns.hasName && !columns.hasOwnerId) {
    console.log("Restaurant legacy profile columns not found. Compatibility preflight skipped.");
    return;
  }

  const businesses = await getRestaurantBusinessTargets();

  if (businesses.length === 0) {
    console.log("No active RESTAURANT business found. Compatibility preflight skipped.");
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
