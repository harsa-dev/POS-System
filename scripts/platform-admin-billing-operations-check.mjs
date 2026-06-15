#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const files = {
  plan: "docs/platform-admin-billing-operations-console-plan.md",
  policy: "artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts",
  moduleTypes: "artifacts/pos-system/src/app/registry/module-types.ts",
  permissionCompat: "artifacts/pos-system/src/app/registry/permission-compat.ts",
  coreModules: "artifacts/pos-system/src/app/registry/core-modules.ts",
  routePage: "artifacts/pos-system/src/pages/dashboard/billing-operations-console.tsx",
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

function getSidebarBlock(content) {
  const marker = 'label: "Billing Operations Console"';
  const start = content.indexOf(marker);

  if (start < 0) {
    throw new Error("core modules is missing Billing Operations Console sidebar entry");
  }

  return content.slice(start, start + 900);
}

const loaded = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [key, readFile(key, filePath)]),
);

const capability = "platform-admin.billing-operations-console.read";
const routePath = "/dashboard/internal/billing-operations-console";
const sidebarBlock = getSidebarBlock(loaded.coreModules);

const checks = [
  () => assertIncludes("plan", loaded.plan, routePath),
  () => assertIncludes("plan", loaded.plan, capability),
  () => assertIncludes("plan", loaded.plan, "BO-1 - Read-only access guard and scope isolation"),
  () => assertIncludes("plan", loaded.plan, "Status: Done"),
  () => assertIncludes("plan", loaded.plan, "BO-2 - Billing Operations Console frontend data source adapter and section fallback"),
  () => assertIncludes("plan", loaded.plan, "no backend endpoint implementation in BO-1"),
  () => assertIncludes("plan", loaded.plan, "no database access"),
  () => assertIncludes("plan", loaded.plan, "no Prisma schema changes"),
  () => assertIncludes("policy", loaded.policy, capability),
  () => assertIncludes("policy", loaded.policy, `"${capability}": ["OWNER", "ADMIN"]`),
  () => assertIncludes("module types", loaded.moduleTypes, capability),
  () => assertIncludes("permission compatibility", loaded.permissionCompat, `"${capability}": PLATFORM_ADMIN_ROLES`),
  () => assertIncludes("core modules", sidebarBlock, "Billing Operations Console"),
  () => assertIncludes("core modules", sidebarBlock, capability),
  () => assertNotIncludes("core modules billing entry", sidebarBlock, "settings.manage"),
  () => assertIncludes("route page", loaded.routePage, "PlatformAdminRoute"),
  () => assertIncludes("route page", loaded.routePage, capability),
  () => assertIncludes("route page", loaded.routePage, "authApi.me"),
  () => assertIncludes("route page", loaded.routePage, "BillingOperationsConsolePage"),
  () => assertNotIncludes("route page", loaded.routePage, "adminRoleConsoleApi"),
  () => assertIncludes("package", loaded.packageJson, "platform-admin:billing-operations-check"),
];

try {
  for (const check of checks) {
    check();
  }

  console.log(`[platform-admin:billing-operations-check] ${checks.length} static checks passed.`);
} catch (error) {
  console.error("[platform-admin:billing-operations-check] Static check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
