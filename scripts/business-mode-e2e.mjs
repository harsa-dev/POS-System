#!/usr/bin/env node

import { spawnSync } from "node:child_process";

async function ensurePlaywrightTestInstalled() {
  try {
    await import("@playwright/test");
  } catch {
    console.error("\n@playwright/test is not installed.");
    console.error("Install browser E2E dependencies when this suite is needed:");
    console.error("  pnpm add -D @playwright/test playwright");
    console.error("  pnpm exec playwright install chromium\n");
    process.exit(1);
  }
}

function runPlaywright() {
  const args = [
    "exec",
    "playwright",
    "test",
    "--config=playwright.business-mode.config.mjs",
  ];

  const result = spawnSync("pnpm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

await ensurePlaywrightTestInstalled();
runPlaywright();
