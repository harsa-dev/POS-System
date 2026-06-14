#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const withSeed = args.has("--seed") || process.env.RESTAURANT_CHECK_WITH_SEED === "true";
const withSmoke = args.has("--smoke") || process.env.RESTAURANT_CHECK_WITH_SMOKE === "true";
const withBuild = args.has("--build") || process.env.RESTAURANT_CHECK_WITH_BUILD === "true";
const isWindows = process.platform === "win32";

const steps = [
  {
    label: "Typecheck Restaurant API server scope",
    command: "pnpm",
    args: ["--filter", "@workspace/api-server", "run", "typecheck:restaurant"],
  },
  {
    label: "Typecheck Restaurant POS frontend scope",
    command: "pnpm",
    args: ["--filter", "@workspace/pos-system", "run", "typecheck:restaurant"],
  },
  ...(withSeed
    ? [
        {
          label: "Seed Restaurant demo data",
          command: "pnpm",
          args: ["--filter", "@workspace/api-server", "run", "restaurant:seed"],
        },
      ]
    : []),
  ...(withSmoke
    ? [
        {
          label: "Run Restaurant API smoke",
          command: "pnpm",
          args: ["run", "restaurant:smoke"],
        },
      ]
    : []),
  ...(withBuild
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
  console.log(`\n[restaurant:check ${stepNumber}] ${step.label}`);
  console.log(`$ ${step.command} ${step.args.join(" ")}`);

  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });

  if (result.error) {
    console.error(`\n[restaurant:check] Failed to start step: ${step.label}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(`\n[restaurant:check] Failed at step: ${step.label}`);
    process.exit(result.status);
  }

  if (result.signal) {
    console.error(`\n[restaurant:check] Step was interrupted by signal ${result.signal}: ${step.label}`);
    process.exit(1);
  }
}

console.log("Restaurant scoped validation only. Non-Restaurant global errors are intentionally outside this gate.");
console.log(`Seed step: ${withSeed ? "enabled" : "skipped"}`);
console.log(`API smoke step: ${withSmoke ? "enabled" : "skipped"}`);
console.log(`Frontend build step: ${withBuild ? "enabled" : "skipped"}`);

steps.forEach(runStep);

console.log("\n[restaurant:check] Restaurant scoped validation passed.");
