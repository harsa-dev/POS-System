#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const withDb = args.has("--db") || process.env.SERVICE_CHECK_WITH_DB === "true";
const withSeed = args.has("--seed") || process.env.SERVICE_CHECK_WITH_SEED === "true";
const withEnsureBusiness = withSeed || args.has("--ensure-business") || process.env.SERVICE_CHECK_ENSURE_BUSINESS === "true";
const skipBuild = args.has("--no-build") || process.env.SERVICE_CHECK_SKIP_BUILD === "true";
const skipSmoke = args.has("--no-smoke") || process.env.SERVICE_CHECK_SKIP_SMOKE === "true";
const isWindows = process.platform === "win32";

const steps = [
  ...(withDb
    ? [
        {
          label: "Apply Service Business scoped database baseline",
          command: "pnpm",
          args: ["--filter", "@workspace/api-server", "run", "service:db:apply"],
        },
      ]
    : []),
  {
    label: "Generate API Prisma client",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "generate"],
  },
  ...(withEnsureBusiness
    ? [
        {
          label: "Ensure Service Business demo tenant",
          command: "pnpm",
          args: ["--filter", "@workspace/api-server", "run", "service:ensure-business"],
        },
      ]
    : []),
  ...(withSeed
    ? [
        {
          label: "Seed Service Business demo data",
          command: "pnpm",
          args: ["--filter", "@workspace/api-server", "run", "service:seed"],
        },
      ]
    : []),
  {
    label: "Typecheck Service Business API server scope",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "typecheck:service"],
  },
  {
    label: "Typecheck Service Business POS frontend scope",
    command: "pnpm",
    args: ["--filter", "@workspace/pos-system", "run", "typecheck:service"],
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
          label: "Run Service Business read-only API smoke",
          command: "pnpm",
          args: ["run", "service:smoke"],
        },
      ]
    : []),
];

function runStep(step, index) {
  const stepNumber = `${index + 1}/${steps.length}`;
  console.log(`\n[service:check ${stepNumber}] ${step.label}`);
  console.log(`$ ${step.command} ${step.args.join(" ")}`);

  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });

  if (result.error) {
    console.error(`\n[service:check] Failed to start step: ${step.label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(`\n[service:check] Failed at step: ${step.label}`);
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`\n[service:check] Step was interrupted by signal ${result.signal}: ${step.label}`);
    process.exit(1);
  }
}

console.log("Service Business scoped validation only. Non-Service global typecheck errors are intentionally outside this gate.");
console.log(`Database baseline step: ${withDb ? "enabled" : "skipped"}`);
console.log(`Ensure demo business step: ${withEnsureBusiness ? "enabled" : "skipped"}`);
console.log(`Seed step: ${withSeed ? "enabled" : "skipped"}`);
console.log(`Frontend build step: ${skipBuild ? "skipped" : "enabled"}`);
console.log(`API smoke step: ${skipSmoke ? "skipped" : "enabled"}`);

steps.forEach(runStep);

console.log("\n[service:check] Service Business scoped validation passed.");
