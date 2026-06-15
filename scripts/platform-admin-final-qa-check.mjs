#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();

function read(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

function assertFileExists(path) {
  if (!existsSync(resolve(rootDir, path))) {
    throw new Error(`Expected file to exist: ${path}`);
  }
}

function assertContains({ label, content, expected }) {
  if (!content.includes(expected)) {
    throw new Error(`${label} is missing expected content: ${expected}`);
  }
}

const qaPath = "docs/platform-admin-internal-monitoring-final-qa.md";

assertFileExists(qaPath);

const qa = read(qaPath);
const packageJson = read("package.json");

const checks = [
  () => assertContains({ label: "final QA checklist", content: qa, expected: "/dashboard/internal-monitoring" }),
  () => assertContains({ label: "final QA command gate", content: qa, expected: "pnpm platform-admin:check" }),
  () => assertContains({ label: "final QA command gate", content: qa, expected: "pnpm platform-admin:policy-parity" }),
  () => assertContains({ label: "final QA command gate", content: qa, expected: "pnpm platform-admin:contract-parity" }),
  () => assertContains({ label: "final QA command gate", content: qa, expected: "pnpm business-mode:check" }),
  () => assertContains({ label: "final QA browser smoke", content: qa, expected: "pnpm platform-admin:browser-smoke" }),
  () => assertContains({ label: "final QA role smoke", content: qa, expected: "OWNER / ADMIN" }),
  () => assertContains({ label: "final QA role smoke", content: qa, expected: "MANAGER / OPERATOR / STAFF / VIEWER" }),
  () => assertContains({ label: "final QA runtime smoke", content: qa, expected: "Runtime Status panel must render" }),
  () => assertContains({ label: "final QA runtime smoke", content: qa, expected: "Mutation Readiness & Dry-run Contracts panel must render" }),
  () => assertContains({ label: "final QA blocked mutations", content: qa, expected: "POST /api/internal/*" }),
  () => assertContains({ label: "final QA blocked mutations", content: qa, expected: "PATCH /api/internal/*" }),
  () => assertContains({ label: "final QA blocked mutations", content: qa, expected: "DELETE /api/internal/*" }),
  () => assertContains({ label: "final QA blocked mutations", content: qa, expected: "PATCH /api/internal/alerts/:alertId/acknowledge" }),
  () => assertContains({ label: "final QA contract gate", content: qa, expected: "docs/platform-admin-internal-monitoring-contract-snapshot.json" }),
  () => assertContains({ label: "final QA policy parity", content: qa, expected: "platform-admin.internal-monitoring.read" }),
  () => assertContains({ label: "final QA handoff", content: qa, expected: "Do not promote real platform mutations yet" }),
  () => assertContains({ label: "package final QA command", content: packageJson, expected: "platform-admin:final-qa" }),
];

try {
  checks.forEach((check) => check());
  console.log(`[platform-admin:final-qa] ${checks.length} QA checks passed.`);
} catch (error) {
  console.error("[platform-admin:final-qa] QA check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
