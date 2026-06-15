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
    throw new Error(`Probe persistence phase must stay read-only for frontend/internal routes. Found /api/internal write wiring in: ${violations.join(", ")}`);
  }
}

const migrationPath = "artifacts/api-server/prisma/migrations/20260615000000_add_internal_system_probes/migration.sql";

const files = {
  plan: read("docs/platform-admin-internal-monitoring-persistence-plan.md"),
  dashboardPlan: read("docs/platform-admin-internal-monitoring-dashboard-plan.md"),
  runtimeProbes: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-runtime-probes.ts"),
  migration: read(migrationPath),
  historyReader: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-system-probe-history.ts"),
  backendRoute: read("artifacts/api-server/src/routes/internal-monitoring.ts"),
  frontendDataSource: read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-data-source.ts"),
  controlRoom: read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx"),
};

const checks = [
  () => assertFileExists("docs/platform-admin-internal-monitoring-persistence-plan.md"),
  () => assertFileExists(migrationPath),
  () => assertFileExists("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-system-probe-history.ts"),
  () => assertContains({ label: "persistence plan", content: files.plan, expected: "InternalSystemProbe" }),
  () => assertContains({ label: "persistence plan promoted state", content: files.plan, expected: "Persistence migration: implemented as migration SQL" }),
  () => assertContains({ label: "persistence plan history api", content: files.plan, expected: "GET /api/internal/probes/history" }),
  () => assertContains({ label: "persistence plan retention", content: files.plan, expected: "keep 14 days of probe snapshots" }),
  () => assertContains({ label: "persistence plan schema missing handling", content: files.plan, expected: "schema-missing" }),
  () => assertContains({ label: "persistence plan blocked scheduled writes", content: files.plan, expected: "scheduled collector" }),
  () => assertContains({ label: "migration table", content: files.migration, expected: "internal_system_probes" }),
  () => assertContains({ label: "migration status check", content: files.migration, expected: "internal_system_probes_status_check" }),
  () => assertContains({ label: "migration probe index", content: files.migration, expected: "internal_system_probes_probe_id_observed_at_idx" }),
  () => assertContains({ label: "history reader", content: files.historyReader, expected: "getInternalSystemProbeHistory" }),
  () => assertContains({ label: "history reader table", content: files.historyReader, expected: "internal_system_probes" }),
  () => assertContains({ label: "history reader missing table", content: files.historyReader, expected: "schema-missing" }),
  () => assertContains({ label: "backend history route", content: files.backendRoute, expected: "router.get(\"/internal/probes/history\"" }),
  () => assertContains({ label: "frontend data source probe history", content: files.frontendDataSource, expected: "probeHistory" }),
  () => assertContains({ label: "control room probe history panel", content: files.controlRoom, expected: "InternalSystemProbe History" }),
  () => assertContains({ label: "runtime probes collector still exists", content: files.runtimeProbes, expected: "collectInternalMonitoringRuntimeProbes" }),
  () => assertContains({ label: "dashboard plan mentions IM-18 before persistence", content: files.dashboardPlan, expected: "IM-18 Real runtime probe collector" }),
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
