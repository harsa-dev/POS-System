import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadEnvFile();

const { prisma } = await import("../src/lib/prisma.js");

type RequiredColumnRow = {
  columnName: string;
};

const SEED_INSERT_COLUMNS: Record<string, readonly string[]> = {
  Restaurant: [
    "id",
    "businessId",
    "address",
    "phone",
    "taxRate",
    "serviceRate",
    "currency",
    "orderPrefix",
    "receiptFooter",
    "timezone",
    "qrisEnabled",
    "cashEnabled",
    "cardEnabled",
  ],
  Category: ["id", "businessId", "name"],
  InventoryItem: [
    "id",
    "businessId",
    "name",
    "sku",
    "type",
    "unit",
    "currentStock",
    "minimumStock",
    "costPerUnit",
    "updatedAt",
  ],
  MenuItem: [
    "id",
    "businessId",
    "categoryId",
    "name",
    "description",
    "price",
    "isAvailable",
    "updatedAt",
  ],
  Recipe: ["id", "menuItemId", "inventoryItemId", "quantityNeeded"],
  DiningTable: ["id", "businessId", "name", "capacity", "status", "isActive", "updatedAt"],
  Order: [
    "id",
    "businessId",
    "orderNumber",
    "subtotal",
    "taxAmount",
    "serviceAmount",
    "total",
    "paymentMethod",
    "amountPaid",
    "changeAmount",
    "status",
    "inventoryDeducted",
    "tableId",
    "type",
    "createdAt",
    "updatedAt",
  ],
  OrderItem: ["id", "orderId", "menuItemId", "quantity", "price", "subtotal"],
  Payment: ["id", "orderId", "provider", "method", "status", "paidAt", "updatedAt"],
  CashflowEntry: [
    "id",
    "businessId",
    "type",
    "account",
    "amount",
    "status",
    "occurredAt",
    "title",
    "description",
    "sourceType",
    "sourceId",
    "reference",
    "createdAt",
    "updatedAt",
  ],
};

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

async function getRequiredColumnsWithoutDefault(tableName: string) {
  if (!(await tableExists(tableName))) return [];

  return prisma.$queryRaw<RequiredColumnRow[]>`
    SELECT column_name AS "columnName"
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND is_nullable = 'NO'
      AND column_default IS NULL
    ORDER BY ordinal_position ASC
  `;
}

async function relaxColumn(tableName: string, columnName: string) {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE ${quoteIdentifier(tableName)} ALTER COLUMN ${quoteIdentifier(columnName)} DROP NOT NULL`,
  );
}

async function main() {
  const relaxedColumns: string[] = [];

  for (const [tableName, insertedColumns] of Object.entries(SEED_INSERT_COLUMNS)) {
    const insertedColumnSet = new Set(insertedColumns);
    const requiredColumns = await getRequiredColumnsWithoutDefault(tableName);

    for (const { columnName } of requiredColumns) {
      if (insertedColumnSet.has(columnName)) continue;

      await relaxColumn(tableName, columnName);
      relaxedColumns.push(`${tableName}.${columnName}`);
    }
  }

  if (relaxedColumns.length > 0) {
    console.log(`Restaurant seed schema normalized: ${relaxedColumns.join(", ")}.`);
    return;
  }

  console.log("Restaurant seed schema already normalized.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
