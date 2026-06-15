#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const files = {
  qa: "docs/platform-admin-admin-role-console-final-qa.md",
  plan: "docs/platform-admin-admin-role-console-plan.md",
  page: "artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-console-page.tsx",
  route: "artifacts/api-server/src/routes/admin-role-console.ts",
  dataSource: "artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-console-data-source.ts",
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

const qa = readFile("admin role final QA", files.qa);
const plan = readFile("admin role plan", files.plan);
const page = readFile("admin role page", files.page);
const route = readFile("admin role backend route", files.route);
const dataSource = readFile("admin role data source", files.dataSource);
const browserSmoke = readFile("admin role browser smoke", files.browserSmoke);
const packageJson = readFile("root package", files.packageJson);

const capability = "platform-admin.admin-role-console.read";
const routePath = "/dashboard/internal/admin-role-console";
const apiPath = "/api/internal/admin-console/roles";

const checks = [
  () => assertIncludes("QA", qa, routePath),
  () => assertIncludes("QA", qa, "Command gate"),
  () => assertIncludes("QA", qa, "Manual smoke matrix"),
  () => assertIncludes("QA", qa, "OWNER / ADMIN"),
  () => assertIncludes("QA", qa, "Non-platform admin roles"),
  () => assertIncludes("QA", qa, "Backend boundary"),
  () => assertIncludes("QA", qa, `GET ${apiPath}`),
  () => assertIncludes("QA", qa, "Frontend boundary"),
  () => assertIncludes("QA", qa, "Browser smoke expectations"),
  () => assertIncludes("QA", qa, "Handoff note"),
  () => assertIncludes("QA", qa, "pnpm platform-admin:admin-role-check"),
  () => assertIncludes("QA", qa, "pnpm platform-admin:admin-role-final-qa"),
  () => assertIncludes("QA", qa, "pnpm platform-admin:admin-role-browser-smoke"),
  () => assertIncludes("QA", qa, "pnpm --filter @workspace/api-server run typecheck:restaurant"),
  () => assertIncludes("QA", qa, "pnpm --filter @workspace/pos-system run typecheck:restaurant"),
  () => assertIncludes("QA", qa, "database access"),
  () => assertIncludes("QA", qa, "Prisma schema changes"),
  () => assertIncludes("QA", qa, "management mutation controls"),
  () => assertIncludes("plan", plan, "AR-6 - Final QA checklist"),
  () => assertIncludes("plan", plan, "Status: Done"),
  () => assertIncludes("page", page, "Read-only Operation Notice"),
  () => assertIncludes("page", page, "Allowed Surface"),
  () => assertIncludes("page", page, "Read-only Safety Boundary"),
  () => assertIncludes("page", page, "Section Source Health"),
  () => assertIncludes("backend route", route, "router.get"),
  () => assertIncludes("backend route", route, apiPath),
  () => assertIncludes("data source", dataSource, "adminRoleConsoleApi.getOverview"),
  () => assertIncludes("data source", dataSource, "getMockAdminRoleConsoleData"),
  () => assertIncludes("browser smoke", browserSmoke, routePath),
  () => assertIncludes("browser smoke", browserSmoke, capability),
  () => assertNotIncludes("browser smoke", browserSmoke, "role assignment button"),
  () => assertIncludes("package", packageJson, "platform-admin:admin-role-final-qa"),
];

try {
  for (const check of checks) {
    check();
  }

  console.log(`[platform-admin:admin-role-final-qa] ${checks.length} QA checks passed.`);
} catch (error) {
  console.error("[platform-admin:admin-role-final-qa] QA check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
