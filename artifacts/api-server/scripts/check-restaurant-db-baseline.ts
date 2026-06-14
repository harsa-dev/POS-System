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

const expectedRoleValues = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"] as const;
const legacyRoleValues = ["CASHIER", "KITCHEN", "SERVER"] as const;

const requiredBusinessIdTables = [
  "Category",
  "MenuItem",
  "InventoryItem",
  "DiningTable",
  "Order",
  "OrderItem",
  "Payment",
  "StockMovement",
  "CashflowEntry",
  "AuditLog",
  "Shift",
  "AttendanceSetting",
  "Invoice",
] as const;

const legacyColumns = [
  { table: "Restaurant", column: "name" },
  { table: "Restaurant", column: "ownerId" },
  { table: "User", column: "restaurantId" },
  { table: "Category", column: "restaurantId" },
  { table: "MenuItem", column: "restaurantId" },
  { table: "DiningTable", column: "restaurantId" },
  { table: "Order", column: "restaurantId" },
  { table: "Shift", column: "restaurantId" },
  { table: "StockMovement", column: "unitCostSnapshot" },
] as const;

type ColumnInfo = {
  table_name: string;
  column_name: string;
  is_nullable: "YES" | "NO";
};

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}

async function getEnumValues(enumName: string) {
  const rows = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
    SELECT enumlabel
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = ${enumName}
    ORDER BY enumsortorder ASC
  `;

  return rows.map((row) => row.enumlabel);
}

async function getTableColumns(tableNames: readonly string[]) {
  return prisma.$queryRaw<ColumnInfo[]>`
    SELECT table_name, column_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY(${tableNames}::text[])
    ORDER BY table_name ASC, ordinal_position ASC
  `;
}

async function getUserRoleCounts() {
  return prisma.$queryRaw<Array<{ role: string; count: bigint }>>`
    SELECT "role"::text AS role, COUNT(*)::bigint AS count
    FROM "User"
    GROUP BY "role"
    ORDER BY "role" ASC
  `;
}

async function getIndexNames() {
  const rows = await prisma.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
  `;

  return new Set(rows.map((row) => row.indexname));
}

async function main() {
  const failures: string[] = [];
  const warnings: string[] = [];

  const roleValues = await getEnumValues("Role");
  const roleCounts = await getUserRoleCounts();
  const allTablesToInspect = Array.from(
    new Set([
      ...requiredBusinessIdTables,
      ...legacyColumns.map((column) => column.table),
    ]),
  );
  const columns = await getTableColumns(allTablesToInspect);
  const indexes = await getIndexNames();

  const columnMap = new Map(
    columns.map((column) => [`${column.table_name}.${column.column_name}`, column]),
  );

  for (const role of expectedRoleValues) {
    if (!roleValues.includes(role)) {
      failures.push(`Role enum is missing canonical value: ${role}`);
    }
  }

  for (const role of legacyRoleValues) {
    const count = roleCounts.find((row) => row.role === role)?.count ?? 0n;

    if (count > 0n) {
      failures.push(`User table still contains legacy role ${role} (${count.toString()} row(s)). Run pnpm --filter @workspace/api-server run restaurant:roles:normalize first.`);
    }

    if (roleValues.includes(role)) {
      warnings.push(`Role enum still contains legacy value ${role}. This is tolerated only before prisma db push removes it.`);
    }
  }

  for (const table of requiredBusinessIdTables) {
    if (!columnMap.has(`${table}.businessId`)) {
      failures.push(`${table}.businessId is missing. Run pnpm --filter @workspace/api-server exec prisma db push --accept-data-loss, then seed again.`);
    }
  }

  for (const legacyColumn of legacyColumns) {
    const column = columnMap.get(`${legacyColumn.table}.${legacyColumn.column}`);

    if (!column) {
      continue;
    }

    warnings.push(`Legacy column still exists: ${legacyColumn.table}.${legacyColumn.column}`);

    if (column.is_nullable === "NO") {
      failures.push(`Legacy column is still NOT NULL: ${legacyColumn.table}.${legacyColumn.column}. It can break canonical Restaurant seed/write flows.`);
    }
  }

  for (const indexName of [
    "Category_businessId_name_key",
    "InventoryItem_businessId_name_key",
    "Order_businessId_orderNumber_key",
  ]) {
    if (!indexes.has(indexName)) {
      failures.push(`Required Restaurant baseline index is missing: ${indexName}`);
    }
  }

  console.log("Restaurant database baseline check");
  console.log(`Role enum values: ${formatList(roleValues)}`);
  console.log(`User role counts: ${formatList(roleCounts.map((row) => `${row.role}:${row.count.toString()}`))}`);

  if (warnings.length > 0) {
    console.warn("\nWarnings:");
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (failures.length > 0) {
    console.error("\nBaseline failures:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nRestaurant database baseline check passed.");
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
