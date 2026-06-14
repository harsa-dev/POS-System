#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const withDb = args.has("--db") || process.env.RAW_MATERIAL_CHECK_WITH_DB === "true";
const withSeed = args.has("--seed") || process.env.RAW_MATERIAL_CHECK_WITH_SEED === "true";
const skipBuild = args.has("--no-build") || process.env.RAW_MATERIAL_CHECK_SKIP_BUILD === "true";
const skipSmoke = args.has("--no-smoke") || process.env.RAW_MATERIAL_CHECK_SKIP_SMOKE === "true";
const isWindows = process.platform === "win32";

const steps = [
  ...(withDb
    ? [
        {
          label: "Apply Raw Material scoped database baseline",
          command: "pnpm",
          args: ["--filter", "@workspace/api-server", "run", "raw-material:db:apply"],
        },
      ]
    : []),
  {
    label: "Generate API Prisma client",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "generate"],
  },
  ...(withSeed
    ? [
        {
          label: "Seed Raw Material demo data",
          command: "pnpm",
          args: ["--filter", "@workspace/api-server", "run", "raw-material:seed"],
        },
      ]
    : []),
  {
    label: "Typecheck Raw Material API server scope",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "typecheck:raw-material"],
  },
  {
    label: "Check Raw Material audit and permission policy",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "raw-material:policy:check"],
  },
  {
    label: "Typecheck Raw Material POS frontend scope",
    command: "pnpm",
    args: ["--filter", "@workspace/pos-system", "run", "typecheck:raw-material"],
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
  ...(!skipSmoke
    ? [
        {
          label: "Run Raw Material read-only API smoke",
          command: "pnpm",
          args: ["run", "raw-material:smoke"],
        },
      ]
    : []),
];

function runStep(step, index) {
  const stepNumber = `${index + 1}/${steps.length}`;
  console.log(`\n[raw-material:check ${stepNumber}] ${step.label}`);
  console.log(`$ ${step.command} ${step.args.join(" ")}`);

  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });

  if (result.error) {
    console.error(`\n[raw-material:check] Failed to start step: ${step.label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(`\n[raw-material:check] Failed at step: ${step.label}`);
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`\n[raw-material:check] Step was interrupted by signal ${result.signal}: ${step.label}`);
    process.exit(1);
  }
}

console.log("Raw Material scoped validation only. Non-Raw-Material global typecheck errors are intentionally outside this gate.");
console.log(`Database baseline step: ${withDb ? "enabled" : "skipped"}`);
console.log(`Seed step: ${withSeed ? "enabled" : "skipped"}`);
console.log(`Frontend build step: ${skipBuild ? "skipped" : "enabled"}`);
console.log(`API smoke step: ${skipSmoke ? "skipped" : "enabled"}`);

steps.forEach(runStep);

console.log("\n[raw-material:check] Raw Material scoped validation passed.");
