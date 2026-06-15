#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const rootDir = process.cwd();
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignoredDirs = new Set([".git", "node_modules", ".next", "dist", "build", "coverage"]);

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

function walk(dir, files = []) {
  const absoluteDir = resolve(rootDir, dir);

  if (!existsSync(absoluteDir)) return files;

  for (const entry of readdirSync(absoluteDir)) {
    if (ignoredDirs.has(entry)) continue;

    const absolutePath = join(absoluteDir, entry);
    const relativePath = absolutePath.replace(`${rootDir}/`, "").replace(`${rootDir}\\`, "");
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      walk(relativePath, files);
      continue;
    }

    if (sourceExtensions.has(extname(entry))) {
      files.push(relativePath);
    }
  }

  return files;
}

function assertNoInternalWriteRoutes() {
  const files = [
    ...walk("artifacts/pos-system/src"),
    ...walk("artifacts/api-server/src"),
  ];

  const violations = [];
  const frontendMutationPattern = /apiClient\s*\.\s*(post|patch|delete)\s*<[^>]*>\s*\(\s*[`'"]\/api\/internal\//g;
  const frontendMutationPatternWithoutGeneric = /apiClient\s*\.\s*(post|patch|delete)\s*\(\s*[`'"]\/api\/internal\//g;
  const backendMutationPattern = /(?:router|app)\s*\.\s*(post|patch|delete)\s*\(\s*[`'"](?:\/api)?\/internal\//g;

  for (const file of files) {
    const content = read(file);

    if (
      frontendMutationPattern.test(content) ||
      frontendMutationPatternWithoutGeneric.test(content) ||
      backendMutationPattern.test(content)
    ) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    throw new Error(`Persistence planning phase must stay read-only. Found /api/internal write wiring in: ${violations.join(", ")}`);
  }
}

const files = {
  plan: read("docs/platform-admin-internal-monitoring-persistence-plan.md"),
  dashboardPlan: read("docs/platform-admin-internal-monitoring-dashboard-plan.md"),
  runtimeProbes: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-runtime-probes.ts"),
};

const checks = [
  () => assertFileExists("docs/platform-admin-internal-monitoring-persistence-plan.md"),
  () => assertContains({
    label: "persistence plan",
    content: files.plan,
    expected: "InternalSystemProbe",
  }),
  () => assertContains({
    label: "persistence plan fields",
    content: files.plan,
    expected: "probeId",
  }),
  () => assertContains({
    label: "persistence plan fields",
    content: files.plan,
    expected: "latencyMs",
  }),
  () => assertContains({
    label: "persistence plan fields",
    content: files.plan,
    expected: "metadataJson",
  }),
  () => assertContains({
    label: "persistence plan indexes",
    content: files.plan,
    expected: "@@index([probeId, observedAt])",
  }),
  () => assertContains({
    label: "persistence plan indexes",
    content: files.plan,
    expected: "@@index([status, observedAt])",
  }),
  () => assertContains({
    label: "persistence plan endpoint",
    content: files.plan,
    expected: "GET /api/internal/probes/history",
  }),
  () => assertContains({
    label: "persistence plan retention",
    content: files.plan,
    expected: "keep 14 days of probe snapshots",
  }),
  () => assertContains({
    label: "persistence plan migration gate",
    content: files.plan,
    expected: "Migration gate",
  }),
  () => assertContains({
    label: "persistence plan rollback",
    content: files.plan,
    expected: "Rollback plan",
  }),
  () => assertContains({
    label: "persistence plan do-not-implement",
    content: files.plan,
    expected: "Do not implement yet",
  }),
  () => assertContains({
    label: "persistence plan command",
    content: files.plan,
    expected: "pnpm platform-admin:persistence-plan",
  }),
  () => assertContains({
    label: "runtime probes collector still exists",
    content: files.runtimeProbes,
    expected: "collectInternalMonitoringRuntimeProbes",
  }),
  () => assertContains({
    label: "dashboard plan mentions IM-18 before persistence",
    content: files.dashboardPlan,
    expected: "IM-18 Real runtime probe collector",
  }),
  () => assertNoInternalWriteRoutes(),
];

try {
  checks.forEach((check) => check());
  console.log(`[platform-admin:persistence-plan] ${checks.length} static checks passed.`);
} catch (error) {
  console.error("[platform-admin:persistence-plan] Static check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
