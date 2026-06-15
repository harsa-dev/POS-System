#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const files = {
  plan: "docs/platform-admin-admin-role-console-plan.md",
  policy: "artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts",
  moduleTypes: "artifacts/pos-system/src/app/registry/module-types.ts",
  permissionCompat: "artifacts/pos-system/src/app/registry/permission-compat.ts",
  coreModules: "artifacts/pos-system/src/app/registry/core-modules.ts",
  routePage: "artifacts/pos-system/src/pages/dashboard/admin-role-console.tsx",
  dataSource: "artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-console-data-source.ts",
  page: "artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-console-page.tsx",
  mock: "artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-consoles.mock.ts",
  backendRoute: "artifacts/api-server/src/routes/admin-role-console.ts",
  backendIndex: "artifacts/api-server/src/routes/index.ts",
  backendTypes: "artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.types.ts",
  backendPolicy: "artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.policy.ts",
  backendResponse: "artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console-response.ts",
  backendService: "artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.service.ts",
  backendMock: "artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.mock-repository.ts",
  frontendApi: "artifacts/pos-system/src/lib/api/admin-role-console-api.ts",
  browserSmoke: "scripts/platform-admin-admin-role-browser-smoke.mjs",
  packageJson: "package.json",
};

function readFile(label, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${label} file is missing: ${relativePath}`);
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function assertIncludes(label, content, expected) {
  if (!content.includes(expected)) {
    throw new Error(`${label} is missing expected content: ${expected}`);
  }
}

function assertNotIncludes(label, content, unexpected) {
  if (content.includes(unexpected)) {
    throw new Error(`${label} contains forbidden content: ${unexpected}`);
  }
}

function getAdminConsoleSidebarBlock(content) {
  const marker = 'label: "Admin Role Console"';
  const start = content.indexOf(marker);

  if (start < 0) {
    throw new Error("core modules is missing Admin Role Console sidebar entry");
  }

  return content.slice(start, start + 900);
}

const loaded = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [key, readFile(key, filePath)]),
);

const capability = "platform-admin.admin-role-console.read";
const routePath = "/dashboard/internal/admin-role-console";
const apiPath = "/api/internal/admin-console/roles";
const adminConsoleSidebarBlock = getAdminConsoleSidebarBlock(loaded.coreModules);

const checks = [
  () => assertIncludes("plan", loaded.plan, routePath),
  () => assertIncludes("plan", loaded.plan, capability),
  () => assertIncludes("plan", loaded.plan, "AR-1 - Read-only access guard and scope isolation"),
  () => assertIncludes("plan", loaded.plan, "AR-2 - Frontend data source adapter and section fallback"),
  () => assertIncludes("plan", loaded.plan, "AR-3 - Backend read-only scaffold and API fallback integration"),
  () => assertIncludes("plan", loaded.plan, "AR-4 - UX hardening and read-only safety copy"),
  () => assertIncludes("plan", loaded.plan, "AR-5 - Browser smoke for platform admin access"),
  () => assertIncludes("plan", loaded.plan, "Status: Done"),
  () => assertIncludes("plan", loaded.plan, "platform-admin-admin-role-browser-smoke.mjs"),
  () => assertIncludes("plan", loaded.plan, "pnpm platform-admin:admin-role-browser-smoke"),
  () => assertIncludes("plan", loaded.plan, "Read-only Operation Notice"),
  () => assertIncludes("plan", loaded.plan, "Fallback State"),
  () => assertIncludes("plan", loaded.plan, "empty-state copy"),
  () => assertIncludes("plan", loaded.plan, "GET /api/internal/admin-console/roles"),
  () => assertIncludes("plan", loaded.plan, "admin-role-console.mock-repository.ts"),
  () => assertIncludes("plan", loaded.plan, "admin-role-console-api.ts"),
  () => assertIncludes("plan", loaded.plan, "no database access"),
  () => assertIncludes("plan", loaded.plan, "no Prisma schema changes"),
  () => assertIncludes("plan", loaded.plan, "AR-6 - Admin Role Console final QA checklist"),
  () => assertNotIncludes("plan", loaded.plan, "backend contract plan"),
  () => assertNotIncludes("plan", loaded.plan, "GET-only contract design"),
  () => assertIncludes("policy", loaded.policy, capability),
  () => assertIncludes("policy", loaded.policy, `"${capability}": ["OWNER", "ADMIN"]`),
  () => assertIncludes("module types", loaded.moduleTypes, capability),
  () => assertIncludes("permission compatibility", loaded.permissionCompat, `"${capability}": PLATFORM_ADMIN_ROLES`),
  () => assertIncludes("core modules", adminConsoleSidebarBlock, "Admin Role Console"),
  () => assertIncludes("core modules", adminConsoleSidebarBlock, capability),
  () => assertNotIncludes("core modules admin console entry", adminConsoleSidebarBlock, `settings.manage`),
  () => assertIncludes("route page", loaded.routePage, "PlatformAdminRoute"),
  () => assertIncludes("route page", loaded.routePage, capability),
  () => assertIncludes("route page", loaded.routePage, "authApi.me"),
  () => assertIncludes("route page", loaded.routePage, "@/features/shared/platform-monitoring/admin-role-console-page"),
  () => assertNotIncludes("route page", loaded.routePage, "internal-admin-console-page"),
  () => assertIncludes("data source", loaded.dataSource, "loadAdminRoleConsoleData"),
  () => assertIncludes("data source", loaded.dataSource, "adminRoleConsoleApi.getOverview"),
  () => assertIncludes("data source", loaded.dataSource, "getMockAdminRoleConsoleData"),
  () => assertIncludes("data source", loaded.dataSource, "fallback"),
  () => assertIncludes("admin role page", loaded.page, "getSourceCopy"),
  () => assertIncludes("admin role page", loaded.page, "Read-only Operation Notice"),
  () => assertIncludes("admin role page", loaded.page, "Allowed Surface"),
  () => assertIncludes("admin role page", loaded.page, "Write Boundary"),
  () => assertIncludes("admin role page", loaded.page, "Fallback State"),
  () => assertIncludes("admin role page", loaded.page, "EmptyState"),
  () => assertIncludes("admin role page", loaded.page, "Source: {data.source}"),
  () => assertIncludes("admin role page", loaded.page, "Section Source Health"),
  () => assertIncludes("admin role page", loaded.page, "Read-only Safety Boundary"),
  () => assertIncludes("admin role page", loaded.page, apiPath),
  () => assertIncludes("admin role page", loaded.page, "No DB, Prisma"),
  () => assertNotIncludes("admin role page", loaded.page, "Future API Contracts"),
  () => assertNotIncludes("admin role page", loaded.page, "Backend Contract Map"),
  () => assertIncludes("mock", loaded.mock, "admin-role-console"),
  () => assertIncludes("mock", loaded.mock, "AdminRolePolicy"),
  () => assertIncludes("backend route", loaded.backendRoute, "router.get"),
  () => assertIncludes("backend route", loaded.backendRoute, apiPath),
  () => assertIncludes("backend route", loaded.backendRoute, "requireRole"),
  () => assertIncludes("backend route", loaded.backendRoute, "ADMIN_ROLE_CONSOLE_POLICY"),
  () => assertIncludes("backend route", loaded.backendRoute, "adminRoleConsoleSuccessResponse"),
  () => assertIncludes("backend route index", loaded.backendIndex, "adminRoleConsoleRouter"),
  () => assertIncludes("backend types", loaded.backendTypes, "AdminRoleConsoleOverviewDto"),
  () => assertIncludes("backend policy", loaded.backendPolicy, capability),
  () => assertIncludes("backend policy", loaded.backendPolicy, "Role.OWNER"),
  () => assertIncludes("backend policy", loaded.backendPolicy, "Role.ADMIN"),
  () => assertIncludes("backend response", loaded.backendResponse, "readOnly: true"),
  () => assertIncludes("backend service", loaded.backendService, "getAdminRoleConsoleOverview"),
  () => assertIncludes("backend mock", loaded.backendMock, "getAdminRoleConsoleMockOverview"),
  () => assertIncludes("backend mock", loaded.backendMock, apiPath),
  () => assertIncludes("frontend api", loaded.frontendApi, "adminRoleConsoleApi"),
  () => assertIncludes("frontend api", loaded.frontendApi, apiPath),
  () => assertIncludes("browser smoke", loaded.browserSmoke, routePath),
  () => assertIncludes("browser smoke", loaded.browserSmoke, "Read-only Operation Notice"),
  () => assertIncludes("browser smoke", loaded.browserSmoke, "Platform Admin Restricted"),
  () => assertIncludes("browser smoke", loaded.browserSmoke, capability),
  () => assertIncludes("browser smoke", loaded.browserSmoke, "no management mutation controls are visible"),
  () => assertIncludes("package", loaded.packageJson, "platform-admin:admin-role-check"),
  () => assertIncludes("package", loaded.packageJson, "platform-admin:admin-role-browser-smoke"),
];

try {
  for (const check of checks) {
    check();
  }

  console.log(`[platform-admin:admin-role-check] ${checks.length} static checks passed.`);
} catch (error) {
  console.error("[platform-admin:admin-role-check] Static check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
