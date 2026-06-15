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

const files = {
  rootPackage: read("package.json"),
  apiPackage: read("artifacts/api-server/package.json"),
  strategy: read("docs/platform-admin-dev-db-reset-strategy.md"),
  monitoringPlan: read("docs/platform-admin-internal-monitoring-dashboard-plan.md"),
  persistencePlan: read("docs/platform-admin-internal-monitoring-persistence-plan.md"),
};

const checks = [
  () => assertFileExists("docs/platform-admin-dev-db-reset-strategy.md"),
  () => assertContains({ label: "dev database strategy", content: files.strategy, expected: "P3005" }),
  () => assertContains({ label: "dev database strategy", content: files.strategy, expected: "prisma db push --accept-data-loss" }),
  () => assertContains({ label: "dev database strategy", content: files.strategy, expected: "dev:db:repair" }),
  () => assertContains({ label: "dev database strategy", content: files.strategy, expected: "prisma:migrate:status" }),
  () => assertContains({ label: "dev database strategy", content: files.strategy, expected: "migrate deploy" }),
  () => assertContains({ label: "dev database strategy", content: files.strategy, expected: "baseline migration history" }),
  () => assertContains({ label: "dev database strategy", content: files.strategy, expected: "schema-missing" }),
  () => assertContains({ label: "dev database strategy", content: files.strategy, expected: "Do not use accept-data-loss commands on production" }),
  () => assertContains({ label: "api-server package", content: files.apiPackage, expected: "prisma:migrate:status" }),
  () => assertContains({ label: "api-server package", content: files.apiPackage, expected: "prisma:db:push:dev" }),
  () => assertContains({ label: "api-server package", content: files.apiPackage, expected: "dev:db:repair" }),
  () => assertContains({ label: "api-server dev db push", content: files.apiPackage, expected: "prisma db push --accept-data-loss" }),
  () => assertContains({ label: "api-server repair command", content: files.apiPackage, expected: "restaurant:seed" }),
  () => assertContains({ label: "root package command", content: files.rootPackage, expected: "platform-admin:dev-db-strategy" }),
  () => assertContains({ label: "platform admin check includes dev db strategy", content: files.rootPackage, expected: "platform-admin-dev-db-strategy-check.mjs" }),
  () => assertContains({ label: "internal monitoring plan", content: files.monitoringPlan, expected: "Dev database reset strategy" }),
  () => assertContains({ label: "internal monitoring plan", content: files.monitoringPlan, expected: "IM-21" }),
  () => assertContains({ label: "persistence plan", content: files.persistencePlan, expected: "development database repair" }),
];

try {
  checks.forEach((check) => check());
  console.log(`[platform-admin:dev-db-strategy] ${checks.length} dev database strategy checks passed.`);
} catch (error) {
  console.error("[platform-admin:dev-db-strategy] Static check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
