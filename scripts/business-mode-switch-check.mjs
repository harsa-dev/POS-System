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

function assertMatches({ label, content, pattern }) {
  if (!pattern.test(content)) {
    throw new Error(`${label} does not match expected pattern: ${pattern}`);
  }
}

const files = {
  contract: read("artifacts/pos-system/src/config/business-modes/business-mode-contract.ts"),
  types: read("artifacts/pos-system/src/components/core/business-mode/business-mode.types.ts"),
  registry: read("artifacts/pos-system/src/components/core/business-mode/business-mode-registry.ts"),
  storage: read("artifacts/pos-system/src/components/core/business-mode/business-mode-storage.ts"),
  service: read("artifacts/pos-system/src/components/core/business-mode/business-mode-service.ts"),
  routeGuard: read("artifacts/pos-system/src/components/core/route-guard/route-guard.tsx"),
  app: read("artifacts/pos-system/src/App.tsx"),
  selector: read("artifacts/pos-system/src/components/core/mode-selector/mode-selector.tsx"),
  switcher: read("artifacts/pos-system/src/components/core/business-mode/business-mode-switcher.tsx"),
  sidebar: read("artifacts/pos-system/src/components/core/sidebar/sidebar.tsx"),
  permissionCompat: read("artifacts/pos-system/src/app/registry/permission-compat.ts"),
  sharedDashboardModeContext: read("artifacts/pos-system/src/features/shared/dashboard/shared-dashboard-mode-context.ts"),
  dashboardShell: read("artifacts/pos-system/src/features/shared/dashboard/dashboard-shell.tsx"),
  cashflowDashboard: read("artifacts/pos-system/src/features/shared/cashflow/cashflow-dashboard.tsx"),
  browserSmoke: read("scripts/business-mode-browser-smoke.mjs"),
  e2eRunner: read("scripts/business-mode-e2e.mjs"),
  e2eConfig: read("playwright.business-mode.config.mjs"),
  e2eSpec: read("tests/business-mode/business-mode-switch.spec.ts"),
  docs: read("docs/business-mode-switch-flow-plan.md"),
};

const checks = [
  () => assertContains({
    label: "business mode types",
    content: files.types,
    expected: "BUSINESS_MODE_CHANGED_EVENT",
  }),
  () => assertContains({
    label: "business mode types",
    content: files.types,
    expected: "BUSINESS_MODE_STORAGE_KEY",
  }),
  () => assertContains({
    label: "business mode contract",
    content: files.contract,
    expected: 'id: "restaurant"',
  }),
  () => assertContains({
    label: "business mode contract",
    content: files.contract,
    expected: 'id: "retail"',
  }),
  () => assertContains({
    label: "business mode contract",
    content: files.contract,
    expected: 'id: "raw-material"',
  }),
  () => assertContains({
    label: "business mode contract",
    content: files.contract,
    expected: 'id: "custom-business"',
  }),
  () => assertContains({
    label: "business mode storage legacy repair",
    content: files.contract,
    expected: "fnb: \"restaurant\"",
  }),
  () => assertContains({
    label: "business mode storage legacy repair",
    content: files.contract,
    expected: "warehouse: \"raw-material\"",
  }),
  () => assertContains({
    label: "business mode transition service",
    content: files.service,
    expected: "BusinessModeTransitionResult",
  }),
  () => assertContains({
    label: "business mode transition service",
    content: files.service,
    expected: "getBusinessModeRouteSupport",
  }),
  () => assertContains({
    label: "business mode transition service",
    content: files.service,
    expected: "getSelectModeRoute",
  }),
  () => assertContains({
    label: "business mode transition service",
    content: files.service,
    expected: "getBusinessModeSelectionRedirectRoute",
  }),
  () => assertContains({
    label: "restaurant route isolation",
    content: files.service,
    expected: "supportedModes: [\"restaurant\"]",
  }),
  () => assertContains({
    label: "retail route isolation",
    content: files.service,
    expected: "supportedModes: [\"retail\"]",
  }),
  () => assertContains({
    label: "raw material route isolation",
    content: files.service,
    expected: "supportedModes: [\"raw-material\"]",
  }),
  () => assertContains({
    label: "route guard select-mode next redirect",
    content: files.routeGuard,
    expected: "businessModeService.getSelectModeRoute(pathname)",
  }),
  () => assertContains({
    label: "mode selector next route",
    content: files.selector,
    expected: "getNextRoute(location)",
  }),
  () => assertContains({
    label: "mode selector compatible next redirect",
    content: files.selector,
    expected: "getSelectionRedirectRoute",
  }),
  () => assertContains({
    label: "business mode switcher transition service",
    content: files.switcher,
    expected: "businessModeService.switchMode",
  }),
  () => assertContains({
    label: "query cache reset on mode switch",
    content: files.app,
    expected: "queryClient.clear()",
  }),
  () => assertContains({
    label: "sidebar route support filtering",
    content: files.sidebar,
    expected: "getRouteSupport",
  }),
  () => assertContains({
    label: "sidebar mode-aware title",
    content: files.sidebar,
    expected: "Workspace",
  }),
  () => assertMatches({
    label: "permission compatibility uses generalized roles",
    content: files.permissionCompat,
    pattern: /OWNER|MANAGER|ADMIN|OPERATOR|STAFF|VIEWER/,
  }),
  () => {
    const legacyRolePattern = /\b(CASHIER|KITCHEN|SERVER)\b/;
    if (legacyRolePattern.test(files.permissionCompat)) {
      throw new Error("permission-compat.ts still contains legacy runtime roles CASHIER/KITCHEN/SERVER");
    }
  },
  () => assertFileExists("artifacts/pos-system/src/features/shared/dashboard/shared-dashboard-mode-context.ts"),
  () => assertContains({
    label: "shared dashboard mode context",
    content: files.sharedDashboardModeContext,
    expected: "SharedDashboardModeContext",
  }),
  () => assertContains({
    label: "shared dashboard mode context",
    content: files.sharedDashboardModeContext,
    expected: "queryScopeKey",
  }),
  () => assertContains({
    label: "shared dashboard mode context",
    content: files.sharedDashboardModeContext,
    expected: "apiModeHeader",
  }),
  () => assertContains({
    label: "dashboard shell mode badge",
    content: files.dashboardShell,
    expected: "SharedDashboardModeBadge",
  }),
  () => assertContains({
    label: "dashboard shell mode context panel",
    content: files.dashboardShell,
    expected: "Mode context unavailable",
  }),
  () => assertContains({
    label: "cashflow mode context subscription",
    content: files.cashflowDashboard,
    expected: "businessModeService.subscribe",
  }),
  () => assertContains({
    label: "cashflow query scope key",
    content: files.cashflowDashboard,
    expected: "modeContext.queryScopeKey",
  }),
  () => assertFileExists("scripts/business-mode-browser-smoke.mjs"),
  () => assertContains({
    label: "business mode browser smoke",
    content: files.browserSmoke,
    expected: "BUSINESS_MODE_SMOKE_COOKIE",
  }),
  () => assertContains({
    label: "business mode browser smoke",
    content: files.browserSmoke,
    expected: "Business-mode browser smoke passed",
  }),
  () => assertFileExists("scripts/business-mode-e2e.mjs"),
  () => assertFileExists("playwright.business-mode.config.mjs"),
  () => assertFileExists("tests/business-mode/business-mode-switch.spec.ts"),
  () => assertContains({
    label: "business mode e2e runner",
    content: files.e2eRunner,
    expected: "@playwright/test is not installed",
  }),
  () => assertContains({
    label: "business mode e2e config",
    content: files.e2eConfig,
    expected: "BUSINESS_MODE_APP_URL",
  }),
  () => assertContains({
    label: "business mode e2e spec",
    content: files.e2eSpec,
    expected: "business mode switch flow",
  }),
  () => assertContains({
    label: "business mode docs",
    content: files.docs,
    expected: "BM-6 - Optional browser switch-flow smoke",
  }),
];

try {
  checks.forEach((check) => check());
  console.log(`[business-mode:check] ${checks.length} switch-flow static checks passed.`);
} catch (error) {
  console.error("[business-mode:check] Switch-flow static check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
