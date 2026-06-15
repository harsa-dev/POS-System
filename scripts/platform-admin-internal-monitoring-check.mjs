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

function assertContainsCaseInsensitive({ label, content, expected }) {
  if (!content.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`${label} is missing expected content: ${expected}`);
  }
}

function assertNotContains({ label, content, forbidden }) {
  if (content.includes(forbidden)) {
    throw new Error(`${label} must not contain: ${forbidden}`);
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
  const filesToScan = [
    ...walk("artifacts/pos-system/src"),
    ...walk("artifacts/api-server/src"),
  ];

  const violations = [];
  const patterns = [
    /apiClient\s*\.\s*(post|patch|delete)\s*<[^>]*>\s*\(\s*[`'"]\/api\/internal\//,
    /apiClient\s*\.\s*(post|patch|delete)\s*\(\s*[`'"]\/api\/internal\//,
    /(?:router|app)\s*\.\s*(post|patch|delete)\s*\(\s*[`'"](?:\/api)?\/internal\//,
  ];

  for (const file of filesToScan) {
    const content = read(file);

    if (patterns.some((pattern) => pattern.test(content))) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    throw new Error(`Internal Monitoring phase is read-only. Found /api/internal mutation wiring in: ${violations.join(", ")}`);
  }
}

function assertInternalMonitorSidebarPermission(files) {
  const internalMonitorEntryPattern = /label:\s*"Internal Monitor"[\s\S]*?routePath:\s*ROUTES\.INTERNAL_MONITORING[\s\S]*?requiredPermissions:\s*\["platform-admin\.internal-monitoring\.read"\]/;

  if (!internalMonitorEntryPattern.test(files.coreModules)) {
    throw new Error("Internal Monitor sidebar entry must use platform-admin.internal-monitoring.read instead of broad settings.manage.");
  }
}

const files = {
  packageJson: read("package.json"),
  plan: read("docs/platform-admin-internal-monitoring-dashboard-plan.md"),
  platformPlan: read("docs/platform-admin-next-implementation-plan.md"),
  monitoringPlan: read("docs/v3/internal-monitoring-dashboard-plan.md"),
  routePhase: read("docs/v3/internal-admin-consoles-route-phase.md"),
  contractSnapshot: read("docs/platform-admin-internal-monitoring-contract-snapshot.json"),
  contractParity: read("scripts/platform-admin-contract-parity-check.mjs"),
  routes: read("artifacts/pos-system/src/constants/routes.ts"),
  app: read("artifacts/pos-system/src/App.tsx"),
  coreModules: read("artifacts/pos-system/src/app/registry/core-modules.ts"),
  moduleTypes: read("artifacts/pos-system/src/app/registry/module-types.ts"),
  permissionCompat: read("artifacts/pos-system/src/app/registry/permission-compat.ts"),
  platformAdminPolicy: read("artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts"),
  platformAdminRoute: read("artifacts/pos-system/src/components/core/platform-admin/platform-admin-route.tsx"),
  page: read("artifacts/pos-system/src/pages/dashboard/platform-monitoring.tsx"),
  content: read("artifacts/pos-system/src/features/shared/platform-monitoring/platform-monitoring-content.tsx"),
  dashboard: read("artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-dashboard.tsx"),
  controlRoom: read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx"),
  dataSource: read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-data-source.ts"),
  apiClient: read("artifacts/pos-system/src/lib/api/internal-monitoring-api.ts"),
  frontendDto: read("artifacts/pos-system/src/lib/api/internal-monitoring.dto.ts"),
  backendTypes: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.types.ts"),
  backendResponse: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-response.ts"),
  backendRoute: read("artifacts/api-server/src/routes/internal-monitoring.ts"),
  backendRouteIndex: read("artifacts/api-server/src/routes/index.ts"),
  backendPolicy: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.policy.ts"),
  backendService: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.service.ts"),
  backendRepository: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.mock-repository.ts"),
  mutationReadiness: read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-mutation-readiness.ts"),
  browserSmoke: read("scripts/platform-admin-internal-monitoring-browser-smoke.mjs"),
  contractsMock: read("artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-contracts.mock.ts"),
  upgradeMock: read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-upgrade.mock.ts"),
};

const checks = [
  () => assertFileExists("docs/platform-admin-internal-monitoring-dashboard-plan.md"),
  () => assertContains({ label: "internal monitoring plan", content: files.plan, expected: "Phase 1 must stay read-only" }),
  () => assertContains({ label: "internal monitoring plan", content: files.plan, expected: "GET /api/internal/health/summary" }),
  () => assertContains({ label: "internal monitoring plan", content: files.plan, expected: "POST /api/internal/*" }),
  () => assertContains({ label: "platform admin plan", content: files.platformPlan, expected: "Platform Admin starts read-only" }),
  () => assertContains({ label: "internal monitoring docs", content: files.monitoringPlan, expected: "mock-first internal control room" }),
  () => assertContainsCaseInsensitive({ label: "internal admin route phase docs", content: files.routePhase, expected: "mock-only" }),
  () => assertFileExists("docs/platform-admin-internal-monitoring-contract-snapshot.json"),
  () => assertContains({ label: "contract snapshot", content: files.contractSnapshot, expected: "responseEnvelope" }),
  () => assertContains({ label: "contract snapshot", content: files.contractSnapshot, expected: "InternalMonitoringMutationReadinessContractDto" }),
  () => assertFileExists("scripts/platform-admin-contract-parity-check.mjs"),
  () => assertContains({ label: "contract parity command", content: files.packageJson, expected: "platform-admin:contract-parity" }),
  () => assertContains({ label: "platform admin check includes contract parity", content: files.packageJson, expected: "platform-admin-contract-parity-check.mjs" }),
  () => assertContains({ label: "contract parity script", content: files.contractParity, expected: "assertResponseEnvelope" }),
  () => assertContains({ label: "route constants", content: files.routes, expected: "INTERNAL_MONITORING" }),
  () => assertContains({ label: "route constants", content: files.routes, expected: "/dashboard/internal-monitoring" }),
  () => assertContains({ label: "App platform admin route guard", content: files.app, expected: "PlatformAdminProtectedRoute capability=\"platform-admin.internal-monitoring.read\"" }),
  () => assertContains({ label: "App imports extracted platform admin route", content: files.app, expected: "@/components/core/platform-admin/platform-admin-route" }),
  () => assertNotContains({ label: "App extracted platform admin forbidden panel", content: files.app, forbidden: "function PlatformAdminForbiddenPanel" }),
  () => assertFileExists("artifacts/pos-system/src/components/core/platform-admin/platform-admin-route.tsx"),
  () => assertContains({ label: "extracted platform admin route", content: files.platformAdminRoute, expected: "Platform Admin Restricted" }),
  () => assertContains({ label: "frontend platform admin policy", content: files.platformAdminPolicy, expected: "platform-admin.internal-monitoring.read" }),
  () => assertContains({ label: "frontend platform admin policy", content: files.platformAdminPolicy, expected: "canAccessPlatformAdminCapability" }),
  () => assertContains({ label: "frontend platform admin policy roles", content: files.platformAdminPolicy, expected: "OWNER" }),
  () => assertContains({ label: "frontend platform admin policy roles", content: files.platformAdminPolicy, expected: "ADMIN" }),
  () => assertContains({ label: "module permission union", content: files.moduleTypes, expected: "platform-admin.internal-monitoring.read" }),
  () => assertContains({ label: "permission compatibility map", content: files.permissionCompat, expected: "PLATFORM_ADMIN_ROLES" }),
  () => assertInternalMonitorSidebarPermission(files),
  () => assertContains({ label: "platform monitoring page", content: files.page, expected: "PlatformMonitoringContent" }),
  () => assertContains({ label: "platform monitoring content", content: files.content, expected: "InternalMonitoringControlRoom" }),
  () => assertContains({ label: "dev monitoring dashboard", content: files.dashboard, expected: "getDevMonitoringSummary" }),
  () => assertContains({ label: "control room source badge", content: files.controlRoom, expected: "Fallback Mock" }),
  () => assertContains({ label: "read-only safety banner", content: files.controlRoom, expected: "Read-only internal monitoring" }),
  () => assertContains({ label: "mutation warning copy", content: files.controlRoom, expected: "Dashboard ini hanya observability, bukan mutation console." }),
  () => assertContains({ label: "source health summary", content: files.controlRoom, expected: "Source Health" }),
  () => assertContains({ label: "runtime status panel", content: files.controlRoom, expected: "Runtime Status" }),
  () => assertContains({ label: "runtime status mode", content: files.controlRoom, expected: "Runtime Mode" }),
  () => assertContains({ label: "runtime freshness", content: files.controlRoom, expected: "Freshness" }),
  () => assertContains({ label: "runtime section coverage", content: files.controlRoom, expected: "Section Coverage" }),
  () => assertContains({ label: "runtime operational label", content: files.controlRoom, expected: "Operational - API synced" }),
  () => assertContains({ label: "runtime degraded label", content: files.controlRoom, expected: "Degraded - fallback active" }),
  () => assertContains({ label: "runtime stale warning", content: files.controlRoom, expected: "staleSourceWarning" }),
  () => assertContains({ label: "quick nav", content: files.controlRoom, expected: "Internal Monitoring sections" }),
  () => assertContains({ label: "loading/fallback live region", content: files.controlRoom, expected: "aria-live=\"polite\"" }),
  () => assertContains({ label: "observability-only checklist", content: files.controlRoom, expected: "Observability only" }),
  () => assertContains({ label: "route inventory section", content: files.controlRoom, expected: "Route Inventory" }),
  () => assertContains({ label: "integrity section", content: files.controlRoom, expected: "Data Integrity Checks" }),
  () => assertContains({ label: "mutation readiness panel", content: files.controlRoom, expected: "Mutation Readiness & Dry-run Contracts" }),
  () => assertContains({ label: "mutation readiness copy", content: files.controlRoom, expected: "Dry-run contract metadata only" }),
  () => assertFileExists("artifacts/pos-system/src/lib/api/internal-monitoring.dto.ts"),
  () => assertContains({ label: "frontend dto module", content: files.frontendDto, expected: "InternalMonitoringApiEnvelopeDto" }),
  () => assertContains({ label: "frontend dto module", content: files.frontendDto, expected: "InternalMonitoringMutationReadinessContractDto" }),
  () => assertContains({ label: "api client imports consolidated dto", content: files.apiClient, expected: "./internal-monitoring.dto" }),
  () => assertContains({ label: "data source imports consolidated dto", content: files.dataSource, expected: "@/lib/api/internal-monitoring.dto" }),
  () => assertContains({ label: "data source unwraps envelope", content: files.dataSource, expected: "unwrapInternalMonitoringEnvelope" }),
  () => assertContains({ label: "data source section fallbacks", content: files.dataSource, expected: "sectionFallbacks" }),
  () => assertContains({ label: "data source mutation readiness load", content: files.dataSource, expected: "getMutationReadinessContracts" }),
  () => assertContains({ label: "api client read-only endpoint", content: files.apiClient, expected: "/api/internal/health/summary" }),
  () => assertContains({ label: "api client route inventory endpoint", content: files.apiClient, expected: "/api/internal/routes/inventory" }),
  () => assertContains({ label: "api client contract endpoint", content: files.apiClient, expected: "/api/internal/contracts/readiness" }),
  () => assertContains({ label: "api client integrity endpoint", content: files.apiClient, expected: "/api/internal/data-integrity/checks" }),
  () => assertContains({ label: "api client mutation readiness endpoint", content: files.apiClient, expected: "/api/internal/mutation-readiness/contracts" }),
  () => assertContains({ label: "backend consolidated types", content: files.backendTypes, expected: "InternalMonitoringApiEnvelopeDto" }),
  () => assertContains({ label: "backend consolidated types", content: files.backendTypes, expected: "InternalMonitoringMutationReadinessContractDto" }),
  () => assertContains({ label: "backend response helper", content: files.backendResponse, expected: "internalMonitoringSuccessResponse" }),
  () => assertContains({ label: "backend response helper read-only", content: files.backendResponse, expected: "readOnly: true" }),
  () => assertFileExists("artifacts/api-server/src/routes/internal-monitoring.ts"),
  () => assertContains({ label: "backend route health", content: files.backendRoute, expected: "router.get(\"/internal/health/summary\"" }),
  () => assertContains({ label: "backend route inventory", content: files.backendRoute, expected: "router.get(\"/internal/routes/inventory\"" }),
  () => assertContains({ label: "backend route contracts", content: files.backendRoute, expected: "router.get(\"/internal/contracts/readiness\"" }),
  () => assertContains({ label: "backend route integrity", content: files.backendRoute, expected: "router.get(\"/internal/data-integrity/checks\"" }),
  () => assertContains({ label: "backend route mutation readiness", content: files.backendRoute, expected: "router.get(\"/internal/mutation-readiness/contracts\"" }),
  () => assertContains({ label: "backend route metadata", content: files.backendRoute, expected: "mutationMode: \"design-only\"" }),
  () => assertContains({ label: "backend route index", content: files.backendRouteIndex, expected: "internalMonitoringRouter" }),
  () => assertContains({ label: "backend policy", content: files.backendPolicy, expected: "platform-admin.internal-monitoring.read" }),
  () => assertContains({ label: "backend policy", content: files.backendPolicy, expected: "blockedMutations" }),
  () => assertContains({ label: "backend service", content: files.backendService, expected: "getInternalMonitoringControlRoom" }),
  () => assertContains({ label: "backend mutation readiness service", content: files.backendService, expected: "getInternalMonitoringMutationReadiness" }),
  () => assertContains({ label: "backend repository", content: files.backendRepository, expected: "getInternalMonitoringDataIntegrityChecks" }),
  () => assertFileExists("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-mutation-readiness.ts"),
  () => assertContains({ label: "mutation readiness file", content: files.mutationReadiness, expected: "Dry-run Only" }),
  () => assertContains({ label: "mutation readiness file", content: files.mutationReadiness, expected: "requiredAuditEvent" }),
  () => assertContains({ label: "mutation readiness file", content: files.mutationReadiness, expected: "rollbackPlan" }),
  () => assertContains({ label: "mutation readiness file", content: files.mutationReadiness, expected: "rateLimit" }),
  () => assertFileExists("scripts/platform-admin-internal-monitoring-browser-smoke.mjs"),
  () => assertContains({ label: "browser smoke command", content: files.packageJson, expected: "platform-admin:browser-smoke" }),
  () => assertContains({ label: "browser smoke mock auth", content: files.browserSmoke, expected: "PLATFORM_ADMIN_SMOKE_USE_MOCK_AUTH" }),
  () => assertContains({ label: "browser smoke read-only banner check", content: files.browserSmoke, expected: "read-only safety banner renders" }),
  () => assertContains({ label: "browser smoke runtime helper", content: files.browserSmoke, expected: "expectRuntimeStatusAssertions" }),
  () => assertContains({ label: "browser smoke runtime panel check", content: files.browserSmoke, expected: "runtime status panel renders" }),
  () => assertContains({ label: "browser smoke runtime mode check", content: files.browserSmoke, expected: "runtime mode card renders" }),
  () => assertContains({ label: "browser smoke freshness check", content: files.browserSmoke, expected: "runtime freshness card renders" }),
  () => assertContains({ label: "browser smoke section coverage check", content: files.browserSmoke, expected: "runtime section coverage card renders" }),
  () => assertContains({ label: "browser smoke guardrail check", content: files.browserSmoke, expected: "runtime guardrail card renders" }),
  () => assertContains({ label: "browser smoke runtime label regex", content: files.browserSmoke, expected: "Operational - API synced|Degraded - fallback active|Mock - local preview|Refreshing" }),
  () => assertContains({ label: "browser smoke forbidden check", content: files.browserSmoke, expected: "MANAGER sees platform admin restricted panel" }),
  () => assertContains({ label: "browser smoke mutation check", content: files.browserSmoke, expected: "no internal mutation controls are visible" }),
  () => assertContains({ label: "contracts mock", content: files.contractsMock, expected: "/api/internal/health/summary" }),
  () => assertContains({ label: "upgrade mock API rollout plans", content: files.upgradeMock, expected: "apiRolloutPlans" }),
  () => assertContains({ label: "upgrade mock observability targets", content: files.upgradeMock, expected: "observabilityTargets" }),
  () => assertContains({ label: "upgrade mock runbook steps", content: files.upgradeMock, expected: "internalRunbookSteps" }),
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
