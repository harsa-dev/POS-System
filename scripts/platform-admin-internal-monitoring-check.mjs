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

function assertNoInternalMutationCalls() {
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
    throw new Error(`Internal Monitoring phase is read-only. Found /api/internal mutation wiring in: ${violations.join(", ")}`);
  }
}

function assertInternalMonitorSidebarPermission() {
  const internalMonitorEntryPattern = /label:\s*"Internal Monitor"[\s\S]*?routePath:\s*ROUTES\.INTERNAL_MONITORING[\s\S]*?requiredPermissions:\s*\["platform-admin\.internal-monitoring\.read"\]/;

  if (!internalMonitorEntryPattern.test(files.coreModules)) {
    throw new Error("Internal Monitor sidebar entry must use platform-admin.internal-monitoring.read instead of broad settings.manage.");
  }
}

const files = {
  plan: read("docs/platform-admin-internal-monitoring-dashboard-plan.md"),
  platformPlan: read("docs/platform-admin-next-implementation-plan.md"),
  monitoringPlan: read("docs/v3/internal-monitoring-dashboard-plan.md"),
  routePhase: read("docs/v3/internal-admin-consoles-route-phase.md"),
  routes: read("artifacts/pos-system/src/constants/routes.ts"),
  app: read("artifacts/pos-system/src/App.tsx"),
  coreModules: read("artifacts/pos-system/src/app/registry/core-modules.ts"),
  moduleTypes: read("artifacts/pos-system/src/app/registry/module-types.ts"),
  permissionCompat: read("artifacts/pos-system/src/app/registry/permission-compat.ts"),
  platformAdminPolicy: read("artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts"),
  page: read("artifacts/pos-system/src/pages/dashboard/platform-monitoring.tsx"),
  content: read("artifacts/pos-system/src/features/shared/platform-monitoring/platform-monitoring-content.tsx"),
  dashboard: read("artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-dashboard.tsx"),
  controlRoom: read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx"),
  dataSource: read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-data-source.ts"),
  apiClient: read("artifacts/pos-system/src/lib/api/internal-monitoring-api.ts"),
  backendRoute: read("artifacts/api-server/src/routes/internal-monitoring.ts"),
  backendRouteIndex: read("artifacts/api-server/src/routes/index.ts"),
  backendPolicy: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.policy.ts"),
  backendService: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.service.ts"),
  backendRepository: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.mock-repository.ts"),
  contractsMock: read("artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-contracts.mock.ts"),
  upgradeMock: read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-upgrade.mock.ts"),
};

const checks = [
  () => assertFileExists("docs/platform-admin-internal-monitoring-dashboard-plan.md"),
  () => assertContains({
    label: "internal monitoring plan",
    content: files.plan,
    expected: "Phase 1 must stay read-only",
  }),
  () => assertContains({
    label: "internal monitoring plan",
    content: files.plan,
    expected: "GET /api/internal/health/summary",
  }),
  () => assertContains({
    label: "internal monitoring plan",
    content: files.plan,
    expected: "POST /api/internal/*",
  }),
  () => assertContains({
    label: "platform admin plan",
    content: files.platformPlan,
    expected: "Platform Admin starts read-only",
  }),
  () => assertContains({
    label: "internal monitoring docs",
    content: files.monitoringPlan,
    expected: "mock-first internal control room",
  }),
  () => assertContains({
    label: "internal admin route phase docs",
    content: files.routePhase,
    expected: "Mock-only",
  }),
  () => assertContains({
    label: "route constants",
    content: files.routes,
    expected: "INTERNAL_MONITORING",
  }),
  () => assertContains({
    label: "route constants",
    content: files.routes,
    expected: "/dashboard/internal-monitoring",
  }),
  () => assertContains({
    label: "App route",
    content: files.app,
    expected: "ROUTES.INTERNAL_MONITORING",
  }),
  () => assertContains({
    label: "App platform admin route guard",
    content: files.app,
    expected: "PlatformAdminRoute capability=\"platform-admin.internal-monitoring.read\"",
  }),
  () => assertContains({
    label: "App platform admin forbidden state",
    content: files.app,
    expected: "Platform Admin Restricted",
  }),
  () => assertFileExists("artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts"),
  () => assertContains({
    label: "frontend platform admin policy",
    content: files.platformAdminPolicy,
    expected: "platform-admin.internal-monitoring.read",
  }),
  () => assertContains({
    label: "frontend platform admin policy",
    content: files.platformAdminPolicy,
    expected: "canAccessPlatformAdminCapability",
  }),
  () => assertContains({
    label: "frontend platform admin policy roles",
    content: files.platformAdminPolicy,
    expected: "OWNER",
  }),
  () => assertContains({
    label: "frontend platform admin policy roles",
    content: files.platformAdminPolicy,
    expected: "ADMIN",
  }),
  () => assertContains({
    label: "module permission union",
    content: files.moduleTypes,
    expected: "platform-admin.internal-monitoring.read",
  }),
  () => assertContains({
    label: "permission compatibility map",
    content: files.permissionCompat,
    expected: "PLATFORM_ADMIN_ROLES",
  }),
  () => assertContains({
    label: "permission compatibility key",
    content: files.permissionCompat,
    expected: "platform-admin.internal-monitoring.read",
  }),
  () => assertInternalMonitorSidebarPermission(),
  () => assertContains({
    label: "platform monitoring page",
    content: files.page,
    expected: "PlatformMonitoringContent",
  }),
  () => assertContains({
    label: "platform monitoring content",
    content: files.content,
    expected: "InternalMonitoringControlRoom",
  }),
  () => assertContains({
    label: "dev monitoring dashboard",
    content: files.dashboard,
    expected: "getDevMonitoringSummary",
  }),
  () => assertContains({
    label: "internal monitoring control room",
    content: files.controlRoom,
    expected: "Dev Action Queue",
  }),
  () => assertContains({
    label: "internal monitoring control room uses data source",
    content: files.controlRoom,
    expected: "loadInternalMonitoringControlRoomData",
  }),
  () => assertContains({
    label: "internal monitoring control room source badge",
    content: files.controlRoom,
    expected: "Fallback Mock",
  }),
  () => assertContains({
    label: "internal monitoring control room route inventory section",
    content: files.controlRoom,
    expected: "Route Inventory",
  }),
  () => assertContains({
    label: "internal monitoring control room integrity section",
    content: files.controlRoom,
    expected: "Data Integrity Checks",
  }),
  () => assertFileExists("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-data-source.ts"),
  () => assertContains({
    label: "internal monitoring data source",
    content: files.dataSource,
    expected: "loadInternalMonitoringControlRoomData",
  }),
  () => assertContains({
    label: "internal monitoring data source fallback",
    content: files.dataSource,
    expected: "getInternalMonitoringMockControlRoomData",
  }),
  () => assertContains({
    label: "internal monitoring data source route inventory fallback",
    content: files.dataSource,
    expected: "mockRouteInventory",
  }),
  () => assertContains({
    label: "internal monitoring data source section fallbacks",
    content: files.dataSource,
    expected: "sectionFallbacks",
  }),
  () => assertFileExists("artifacts/pos-system/src/lib/api/internal-monitoring-api.ts"),
  () => assertContains({
    label: "internal monitoring api client",
    content: files.apiClient,
    expected: "internalMonitoringApi",
  }),
  () => assertContains({
    label: "internal monitoring api client read-only endpoint",
    content: files.apiClient,
    expected: "/api/internal/health/summary",
  }),
  () => assertContains({
    label: "internal monitoring api route inventory endpoint",
    content: files.apiClient,
    expected: "/api/internal/routes/inventory",
  }),
  () => assertContains({
    label: "internal monitoring api contract readiness endpoint",
    content: files.apiClient,
    expected: "/api/internal/contracts/readiness",
  }),
  () => assertContains({
    label: "internal monitoring api data integrity endpoint",
    content: files.apiClient,
    expected: "/api/internal/data-integrity/checks",
  }),
  () => assertFileExists("artifacts/api-server/src/routes/internal-monitoring.ts"),
  () => assertContains({
    label: "internal monitoring backend route",
    content: files.backendRoute,
    expected: "router.get(\"/internal/health/summary\"",
  }),
  () => assertContains({
    label: "internal monitoring backend route",
    content: files.backendRoute,
    expected: "router.get(\"/internal/routes/inventory\"",
  }),
  () => assertContains({
    label: "internal monitoring backend route",
    content: files.backendRoute,
    expected: "router.get(\"/internal/contracts/readiness\"",
  }),
  () => assertContains({
    label: "internal monitoring backend route",
    content: files.backendRoute,
    expected: "router.get(\"/internal/data-integrity/checks\"",
  }),
  () => assertContains({
    label: "internal monitoring backend route index",
    content: files.backendRouteIndex,
    expected: "internalMonitoringRouter",
  }),
  () => assertContains({
    label: "internal monitoring backend policy",
    content: files.backendPolicy,
    expected: "platform-admin.internal-monitoring.read",
  }),
  () => assertContains({
    label: "internal monitoring backend policy",
    content: files.backendPolicy,
    expected: "blockedMutations",
  }),
  () => assertContains({
    label: "internal monitoring backend service",
    content: files.backendService,
    expected: "getInternalMonitoringControlRoom",
  }),
  () => assertContains({
    label: "internal monitoring backend repository",
    content: files.backendRepository,
    expected: "getInternalMonitoringDataIntegrityChecks",
  }),
  () => assertContains({
    label: "internal monitoring contracts mock",
    content: files.contractsMock,
    expected: "GET /api/internal/health/summary",
  }),
  () => assertContains({
    label: "internal monitoring upgrade mock",
    content: files.upgradeMock,
    expected: "releaseGates",
  }),
  () => assertNoInternalMutationCalls(),
];

try {
  checks.forEach((check) => check());
  console.log(`[platform-admin:internal-monitoring:check] ${checks.length} static checks passed.`);
} catch (error) {
  console.error("[platform-admin:internal-monitoring:check] Static check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
