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

type RoleCount = {
  role: string;
  count: bigint;
};

async function ensureGeneralRoleValuesExist() {
  await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OPERATOR'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VIEWER'`);
}

async function normalizeLegacyRoles() {
  await prisma.$executeRawUnsafe(`UPDATE "User" SET "role" = 'OPERATOR'::"Role" WHERE "role"::text = 'CASHIER'`);
  await prisma.$executeRawUnsafe(`UPDATE "User" SET "role" = 'STAFF'::"Role" WHERE "role"::text IN ('KITCHEN', 'SERVER')`);
}

async function getRoleCounts() {
  return prisma.$queryRaw<RoleCount[]>`
    SELECT "role"::text AS "role", COUNT(*)::bigint AS "count"
    FROM "User"
    GROUP BY "role"::text
    ORDER BY "role"::text ASC
  `;
}

async function main() {
  await ensureGeneralRoleValuesExist();
  await normalizeLegacyRoles();

  const counts = await getRoleCounts();
  const summary = counts
    .map((item) => `${item.role}: ${item.count.toString()}`)
    .join(", ");

  console.log(`Legacy user roles normalized. Current role counts: ${summary || "none"}.`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
