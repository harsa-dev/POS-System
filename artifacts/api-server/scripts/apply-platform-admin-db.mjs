#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiServerRoot = resolve(__dirname, "..");
const isWindows = process.platform === "win32";

const steps = [
  {
    label: "Apply Internal Monitoring probe history table",
    file: "prisma/sql/internal-system-probes.sql",
  },
];

function runStep(step, index) {
  const stepNumber = `${index + 1}/${steps.length}`;
  console.log(`\n[platform-admin:db:apply ${stepNumber}] ${step.label}`);
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
    console.error(`\n[platform-admin:db:apply] Failed to start step: ${step.label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(`\n[platform-admin:db:apply] Failed at step: ${step.label}`);
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`\n[platform-admin:db:apply] Step interrupted by signal ${result.signal}: ${step.label}`);
    process.exit(1);
  }
}

console.log("Platform Admin scoped database setup only. This intentionally avoids prisma migrate deploy.");
steps.forEach(runStep);
console.log("\n[platform-admin:db:apply] Platform Admin scoped database setup passed.");
