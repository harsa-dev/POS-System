#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const FRONTEND_POLICY_PATH = "artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts";
const BACKEND_POLICY_PATH = "artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.policy.ts";
const SIDEBAR_REGISTRY_PATH = "artifacts/pos-system/src/app/registry/core-modules.ts";
const APP_PATH = "artifacts/pos-system/src/App.tsx";

const INTERNAL_MONITORING_CAPABILITY = "platform-admin.internal-monitoring.read";
const EXPECTED_ALLOWED_ROLES = ["ADMIN", "OWNER"];

function read(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function assertEqualArray(label, actual, expected) {
  const normalizedActual = uniqueSorted(actual);
  const normalizedExpected = uniqueSorted(expected);

  if (normalizedActual.join("|") !== normalizedExpected.join("|")) {
    throw new Error(`${label} mismatch. Expected [${normalizedExpected.join(", ")}], got [${normalizedActual.join(", ")}].`);
  }
}

function assertContains({ label, content, expected }) {
  if (!content.includes(expected)) {
    throw new Error(`${label} missing expected content: ${expected}`);
  }
}

function getFrontendRoles(frontendPolicy) {
  const match = frontendPolicy.match(/"platform-admin\.internal-monitoring\.read"\s*:\s*\[([^\]]+)\]/);
  if (!match) throw new Error("Unable to read frontend internal monitoring allowed roles.");

  return match[1]
    .split(",")
    .map((value) => value.replace(/["'\s]/g, ""))
    .filter(Boolean);
}

function getBackendRoles(backendPolicy) {
  const match = backendPolicy.match(/INTERNAL_MONITORING_READ_ROLES[^=]*=\s*\[([^\]]+)\]/);
  if (!match) throw new Error("Unable to read backend internal monitoring allowed roles.");

  return match[1]
    .split(",")
    .map((value) => value.replace(/Role\.|["'\s]/g, ""))
    .filter(Boolean);
}

function main() {
  const frontendPolicy = read(FRONTEND_POLICY_PATH);
  const backendPolicy = read(BACKEND_POLICY_PATH);
  const sidebarRegistry = read(SIDEBAR_REGISTRY_PATH);
  const app = read(APP_PATH);

  const frontendRoles = getFrontendRoles(frontendPolicy);
  const backendRoles = getBackendRoles(backendPolicy);

  assertEqualArray("frontend policy allowed roles", frontendRoles, EXPECTED_ALLOWED_ROLES);
  assertEqualArray("backend policy allowed roles", backendRoles, EXPECTED_ALLOWED_ROLES);
  assertEqualArray("frontend/backend policy allowed roles", frontendRoles, backendRoles);

  assertContains({
    label: "frontend policy capability",
    content: frontendPolicy,
    expected: INTERNAL_MONITORING_CAPABILITY,
  });
  assertContains({
    label: "backend policy capability",
    content: backendPolicy,
    expected: INTERNAL_MONITORING_CAPABILITY,
  });
  assertContains({
    label: "sidebar internal monitoring permission",
    content: sidebarRegistry,
    expected: `requiredPermissions: ["${INTERNAL_MONITORING_CAPABILITY}"]`,
  });
  assertContains({
    label: "App internal monitoring route guard",
    content: app,
    expected: `PlatformAdminRoute capability="${INTERNAL_MONITORING_CAPABILITY}"`,
  });

  console.log("[platform-admin:policy-parity] frontend/backend/sidebar/route policy parity checks passed.");
}

try {
  main();
} catch (error) {
  console.error("[platform-admin:policy-parity] Policy parity check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
