#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const apiServerRoot = resolve(new URL("..", import.meta.url).pathname);
const migrationsDir = resolve(apiServerRoot, "prisma/migrations");

const forbiddenScopedMigrationDirs = new Set([
  "202606140001_add_retail_core",
  "20260614000300_add_raw_material_intakes",
  "202606140004_add_retail_returns",
  "202606140006_add_raw_material_core_idempotent",
  "202606140007_add_service_business_core_idempotent",
  "20260615000000_add_internal_system_probes",
]);

const requiredSqlFiles = [
  "prisma/sql/retail-core.sql",
  "prisma/sql/retail-returns.sql",
  "prisma/sql/raw-material-core.sql",
  "prisma/sql/service-business-core.sql",
  "prisma/sql/internal-system-probes.sql",
];

const applyScriptExpectations = [
  {
    path: "scripts/apply-retail-db.mjs",
    expected: ["prisma/sql/retail-core.sql", "prisma/sql/retail-returns.sql"],
  },
  {
    path: "scripts/apply-raw-material-db.mjs",
    expected: ["prisma/sql/raw-material-core.sql"],
  },
  {
    path: "scripts/apply-service-business-db.mjs",
    expected: ["prisma/sql/service-business-core.sql"],
  },
  {
    path: "scripts/apply-platform-admin-db.mjs",
    expected: ["prisma/sql/internal-system-probes.sql"],
  },
];

function read(relativePath) {
  return readFileSync(resolve(apiServerRoot, relativePath), "utf8");
}

function assertFileExists(relativePath) {
  if (!existsSync(resolve(apiServerRoot, relativePath))) {
    throw new Error(`Missing expected file: ${relativePath}`);
  }
}

function getMigrationDirs() {
  if (!existsSync(migrationsDir)) return [];

  return readdirSync(migrationsDir).filter((entry) => {
    const path = join(migrationsDir, entry);
    return statSync(path).isDirectory();
  });
}

function assertNoScopedSqlInMigrationHistory() {
  const migrationDirs = getMigrationDirs();
  const offenders = migrationDirs.filter((entry) => forbiddenScopedMigrationDirs.has(entry));

  if (offenders.length > 0) {
    throw new Error(
      `Scoped SQL must not live in prisma/migrations. Move/delete these directories: ${offenders.join(", ")}`,
    );
  }
}

function assertApplyScriptsUseSqlDirectory() {
  for (const item of applyScriptExpectations) {
    const content = read(item.path);

    for (const expected of item.expected) {
      if (!content.includes(expected)) {
        throw new Error(`${item.path} must execute ${expected}`);
      }
    }

    if (content.includes("prisma/migrations/")) {
      throw new Error(`${item.path} must not execute files from prisma/migrations`);
    }
  }
}

function assertRequiredSqlFilesExist() {
  requiredSqlFiles.forEach(assertFileExists);
}

try {
  assertNoScopedSqlInMigrationHistory();
  assertRequiredSqlFilesExist();
  assertApplyScriptsUseSqlDirectory();
  console.log("[prisma:migration-chain:check] Scoped SQL is isolated from Prisma migration history.");
} catch (error) {
  console.error("[prisma:migration-chain:check] Failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
