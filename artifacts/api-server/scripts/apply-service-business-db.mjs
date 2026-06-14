#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiServerRoot = resolve(__dirname, "..");
const isWindows = process.platform === "win32";

const steps = [
  {
    label: "Check Service Business base schema prerequisites",
    file: "prisma/sql/service-business-baseline-guard.sql",
  },
  {
    label: "Apply Service Business core tables, enums, and indexes",
    file: "prisma/migrations/202606140007_add_service_business_core_idempotent/migration.sql",
  },
  {
    label: "Verify Service Business scoped schema",
    file: "prisma/sql/service-business-schema-verify.sql",
  },
];

function runStep(step, index) {
  const stepNumber = `${index + 1}/${steps.length}`;
  console.log(`\n[service:db:apply ${stepNumber}] ${step.label}`);
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
    console.error(`\n[service:db:apply] Failed to start step: ${step.label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(`\n[service:db:apply] Failed at step: ${step.label}`);
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`\n[service:db:apply] Step interrupted by signal ${result.signal}: ${step.label}`);
    process.exit(1);
  }
}

console.log("Service Business scoped database setup only. This intentionally avoids prisma migrate deploy.");
steps.forEach(runStep);
console.log("\n[service:db:apply] Service Business scoped database setup passed.");
