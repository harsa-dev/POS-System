#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiServerRoot = resolve(__dirname, "..");
const isWindows = process.platform === "win32";

const steps = [
  {
    label: "Check Retail base schema prerequisites",
    file: "prisma/sql/retail-baseline-guard.sql",
  },
  {
    label: "Apply Retail core tables and indexes",
    file: "prisma/migrations/202606140001_add_retail_core/migration.sql",
  },
  {
    label: "Apply Retail return tables and indexes",
    file: "prisma/migrations/202606140004_add_retail_returns/migration.sql",
  },
  {
    label: "Verify Retail scoped schema",
    file: "prisma/sql/retail-schema-verify.sql",
  },
];

function runStep(step, index) {
  const stepNumber = `${index + 1}/${steps.length}`;
  console.log(`\n[retail:db:apply ${stepNumber}] ${step.label}`);
  console.log(`$ pnpm exec prisma db execute --file ${step.file}`);

  const result = spawnSync(
    "pnpm",
    ["exec", "prisma", "db", "execute", "--file", step.file],
    {
      cwd: apiServerRoot,
      env: process.env,
      stdio: "inherit",
      shell: isWindows,
    },
  );

  if (result.error) {
    console.error(`\n[retail:db:apply] Failed to start step: ${step.label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(`\n[retail:db:apply] Failed at step: ${step.label}`);
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`\n[retail:db:apply] Step interrupted by signal ${result.signal}: ${step.label}`);
    process.exit(1);
  }
}

console.log("Retail scoped database setup only. This intentionally avoids prisma migrate deploy.");
steps.forEach(runStep);
console.log("\n[retail:db:apply] Retail scoped database setup passed.");
