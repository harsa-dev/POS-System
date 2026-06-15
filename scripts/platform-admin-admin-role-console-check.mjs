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
  mock: "artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-consoles.mock.ts",
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

const plan = readFile("admin role console plan", files.plan);
const policy = readFile("platform admin policy", files.policy);
const moduleTypes = readFile("module types", files.moduleTypes);
const permissionCompat = readFile("permission compatibility", files.permissionCompat);
const coreModules = readFile("core modules", files.coreModules);
const routePage = readFile("admin role route page", files.routePage);
const mock = readFile("internal admin mock", files.mock);
const packageJson = readFile("root package", files.packageJson);

const capability = "platform-admin.admin-role-console.read";
const routePath = "/dashboard/internal/admin-role-console";

const staleSettingsPermissionBlock = `label: "Admin Role Console",
        description: "Mock-only console for internal role assignment, access review, and permission template planning.",
        routePath: ROUTES.ADMIN_ROLE_CONSOLE,
        group: "Core Systems",
        supportedModes: allModes,
        requiredPermissions: ["settings.manage"]`;

const checks = [
  () => assertIncludes("plan", plan, routePath),
  () => assertIncludes("plan", plan, capability),
  () => assertIncludes("plan", plan, "AR-1 - Read-only access guard and scope isolation"),
  () => assertIncludes("plan", plan, "Status: Done"),
  () => assertIncludes("plan", plan, "mock-backed"),
  () => assertIncludes("plan", plan, "no Prisma schema changes"),
  () => assertIncludes("plan", plan, "AR-2 - Admin Role Console frontend data source adapter and section fallback"),
  () => assertIncludes("plan", plan, "Backend read APIs are not the next phase"),
  () => assertIncludes("plan", plan, "section-level fallback behavior"),
  () => assertIncludes("plan", plan, "Draft read surfaces may appear as mock readiness rows"),
  () => assertNotIncludes("plan", plan, "backend contract plan"),
  () => assertNotIncludes("plan", plan, "GET-only contract design"),
  () => assertIncludes("policy", policy, capability),
  () => assertIncludes("policy", policy, `"${capability}": ["OWNER", "ADMIN"]`),
  () => assertIncludes("module types", moduleTypes, capability),
  () => assertIncludes("permission compatibility", permissionCompat, `"${capability}": PLATFORM_ADMIN_ROLES`),
  () => assertIncludes("core modules", coreModules, "Admin Role Console"),
  () => assertIncludes("core modules", coreModules, capability),
  () => assertNotIncludes("core modules admin role entry", coreModules, staleSettingsPermissionBlock),
  () => assertIncludes("route page", routePage, "PlatformAdminRoute"),
  () => assertIncludes("route page", routePage, capability),
  () => assertIncludes("route page", routePage, "authApi.me"),
  () => assertIncludes("mock", mock, "admin-role-console"),
  () => assertIncludes("mock", mock, "Admin Role Console"),
  () => assertIncludes("mock", mock, "AdminRolePolicy"),
  () => assertIncludes("package", packageJson, "platform-admin:admin-role-check"),
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
