#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();

function read(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
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
  types: read("artifacts/pos-system/src/components/core/business-mode/business-mode.types.ts"),
  registry: read("artifacts/pos-system/src/components/core/business-mode/business-mode-registry.ts"),
  storage: read("artifacts/pos-system/src/components/core/business-mode/business-mode-storage.ts"),
  service: read("artifacts/pos-system/src/components/core/business-mode/business-mode-service.ts"),
  routeGuard: read("artifacts/pos-system/src/components/core/route-guard/route-guard.tsx"),
  app: read("artifacts/pos-system/src/App.tsx"),
  selector: read("artifacts/pos-system/src/components/core/business-mode/mode-selector.tsx"),
  switcher: read("artifacts/pos-system/src/components/core/business-mode/business-mode-switcher.tsx"),
  sidebar: read("artifacts/pos-system/src/components/core/sidebar/sidebar.tsx"),
  permissionCompat: read("artifacts/pos-system/src/app/registry/permission-compat.ts"),
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
    label: "business mode registry",
    content: files.registry,
    expected: "id: \"restaurant\"",
  }),
  () => assertContains({
    label: "business mode registry",
    content: files.registry,
    expected: "id: \"retail\"",
  }),
  () => assertContains({
    label: "business mode registry",
    content: files.registry,
    expected: "id: \"raw-material\"",
  }),
  () => assertContains({
    label: "business mode registry",
    content: files.registry,
    expected: "id: \"custom-business\"",
  }),
  () => assertContains({
    label: "business mode storage legacy repair",
    content: files.storage,
    expected: "fnb: \"restaurant\"",
  }),
  () => assertContains({
    label: "business mode storage legacy repair",
    content: files.storage,
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
    expected: "businessModeService.getSelectModeRoute(location)",
  }),
  () => assertContains({
    label: "mode selector next route",
    content: files.selector,
    expected: "getNextRouteFromLocation(location)",
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
  () => assertContains({
    label: "business mode docs",
    content: files.docs,
    expected: "BM-5 - Business-mode smoke checklist/script",
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
