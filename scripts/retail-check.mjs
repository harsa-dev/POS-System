#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const withDb = args.has("--db") || process.env.RETAIL_CHECK_WITH_DB === "true";
const skipBuild = args.has("--no-build") || process.env.RETAIL_CHECK_SKIP_BUILD === "true";
const isWindows = process.platform === "win32";

const steps = [
  ...(withDb
    ? [
        {
          label: "Apply Retail scoped database migrations",
          command: "pnpm",
          args: ["--filter", "@workspace/api-server", "run", "retail:db:apply"],
        },
      ]
    : []),
  {
    label: "Sync Retail Prisma schema models",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "retail:schema:sync"],
  },
  {
    label: "Generate API Prisma client",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "generate"],
  },
  {
    label: "Typecheck Retail API server scope",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "typecheck:retail"],
  },
  {
    label: "Typecheck Retail POS frontend scope",
    command: "pnpm",
    args: ["--filter", "@workspace/pos-system", "run", "typecheck:retail"],
  },
  ...(!skipBuild
    ? [
        {
          label: "Build POS frontend bundle",
          command: "pnpm",
          args: ["--filter", "@workspace/pos-system", "run", "build"],
        },
      ]
    : []),
];

function runStep(step, index) {
  const stepNumber = `${index + 1}/${steps.length}`;
  console.log(`\n[retail:check ${stepNumber}] ${step.label}`);
  console.log(`$ ${step.command} ${step.args.join(" ")}`);

  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });

  if (result.error) {
    console.error(`\n[retail:check] Failed to start step: ${step.label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(`\n[retail:check] Failed at step: ${step.label}`);
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`\n[retail:check] Step was interrupted by signal ${result.signal}: ${step.label}`);
    process.exit(1);
  }
}

console.log("Retail scoped validation only. Non-retail global typecheck errors are intentionally outside this gate.");
console.log(`Database migration step: ${withDb ? "enabled" : "skipped"}`);
console.log(`Frontend build step: ${skipBuild ? "skipped" : "enabled"}`);

steps.forEach(runStep);

console.log("\n[retail:check] Retail scoped validation passed.");
