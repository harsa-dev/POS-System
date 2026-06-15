#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const snapshotPath = "docs/platform-admin-internal-monitoring-contract-snapshot.json";

function read(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

function readJson(path) {
  return JSON.parse(read(path));
}

function fail(message) {
  throw new Error(message);
}

function assertContains({ label, content, expected }) {
  if (!content.includes(expected)) {
    fail(`${label} is missing expected content: ${expected}`);
  }
}

function normalizeList(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function extractTypeBlock(content, typeName) {
  const typePattern = new RegExp(`export\\s+type\\s+${typeName}\\s*=\\s*{([\\s\\S]*?)\\n};`);
  const match = content.match(typePattern);

  if (!match) {
    fail(`Missing exported type block: ${typeName}`);
  }

  return match[1];
}

function assertDtoFields({ label, content, typeName, fields }) {
  const block = extractTypeBlock(content, typeName);

  for (const field of fields) {
    const fieldPattern = new RegExp(`\\b${field}\\??\\s*:`);
    if (!fieldPattern.test(block)) {
      fail(`${label} type ${typeName} is missing field: ${field}`);
    }
  }
}

function assertEndpoint({ snapshotEndpoint, frontendApi, backendRoute, backendService }) {
  assertContains({
    label: `frontend api endpoint ${snapshotEndpoint.id}`,
    content: frontendApi,
    expected: snapshotEndpoint.path,
  });
  assertContains({
    label: `frontend api method ${snapshotEndpoint.id}`,
    content: frontendApi,
    expected: snapshotEndpoint.frontendMethod,
  });
  assertContains({
    label: `backend service ${snapshotEndpoint.id}`,
    content: backendService,
    expected: snapshotEndpoint.backendService,
  });

  const routePath = snapshotEndpoint.path.replace("/api", "");
  const routeCall = `router.get("${routePath}"`;
  assertContains({
    label: `backend route ${snapshotEndpoint.id}`,
    content: backendRoute,
    expected: routeCall,
  });
}

function extractRolesFromPolicy(content, capability) {
  const policyPattern = new RegExp(`"${capability.replaceAll(".", "\\.")}"\\s*:\\s*\\[([^\\]]*)\\]`);
  const match = content.match(policyPattern);

  if (!match) {
    fail(`Missing policy role list for capability: ${capability}`);
  }

  return match[1]
    .split(",")
    .map((entry) => entry.trim().replaceAll('"', ""))
    .filter(Boolean);
}

const snapshot = readJson(snapshotPath);
const frontendDto = read(snapshot.sourceFiles.frontendDto);
const frontendApi = read(snapshot.sourceFiles.frontendApiClient);
const frontendDataSource = read(snapshot.sourceFiles.frontendDataSource);
const backendDto = read(snapshot.sourceFiles.backendDto);
const backendRoute = read(snapshot.sourceFiles.backendRoute);
const backendPolicy = read(snapshot.sourceFiles.backendPolicy);
const frontendPolicy = read("artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts");
const sidebarRegistry = read("artifacts/pos-system/src/app/registry/core-modules.ts");
const app = read("artifacts/pos-system/src/App.tsx");
const controlRoom = read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx");
const backendService = read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.service.ts");

try {
  assertContains({
    label: "snapshot",
    content: read(snapshotPath),
    expected: "InternalMonitoringMutationReadinessContractDto",
  });

  if (snapshot.readOnly !== true) {
    fail("Contract snapshot must remain readOnly: true.");
  }

  if (snapshot.mutationMode !== "design-only") {
    fail("Contract snapshot mutationMode must remain design-only.");
  }

  for (const [typeName, fields] of Object.entries(snapshot.dtoTypes)) {
    assertDtoFields({ label: "frontend DTO", content: frontendDto, typeName, fields });
    assertDtoFields({ label: "backend DTO", content: backendDto, typeName, fields });
  }

  for (const endpoint of snapshot.endpoints) {
    if (endpoint.method !== "GET") {
      fail(`Endpoint ${endpoint.id} must remain GET-only in this phase.`);
    }

    assertEndpoint({
      snapshotEndpoint: endpoint,
      frontendApi,
      backendRoute,
      backendService,
    });
  }

  for (const section of snapshot.dashboardSections) {
    assertContains({
      label: "internal monitoring dashboard section",
      content: controlRoom,
      expected: section,
    });
  }

  for (const blockedMutation of snapshot.blockedMutations) {
    assertContains({
      label: "backend policy blocked mutation list",
      content: backendPolicy,
      expected: blockedMutation,
    });
  }

  const frontendRoles = extractRolesFromPolicy(frontendPolicy, snapshot.capability);
  const backendRoles = extractRolesFromPolicy(backendPolicy, snapshot.capability);
  const expectedRoles = snapshot.allowedRoles;

  const roleTriples = [
    ["frontend", frontendRoles],
    ["backend", backendRoles],
    ["snapshot", expectedRoles],
  ];

  const expectedRoleList = normalizeList(expectedRoles).join(",");
  for (const [label, roles] of roleTriples) {
    const actual = normalizeList(roles).join(",");
    if (actual !== expectedRoleList) {
      fail(`${label} roles do not match snapshot. Expected ${expectedRoleList}; got ${actual}`);
    }
  }

  assertContains({
    label: "frontend data source mutation readiness section",
    content: frontendDataSource,
    expected: "mutationReadinessContracts",
  });
  assertContains({
    label: "sidebar platform admin capability",
    content: sidebarRegistry,
    expected: snapshot.capability,
  });
  assertContains({
    label: "App route platform admin capability",
    content: app,
    expected: `PlatformAdminProtectedRoute capability="${snapshot.capability}"`,
  });

  console.log(`[platform-admin:contract-parity] ${Object.keys(snapshot.dtoTypes).length} DTOs, ${snapshot.endpoints.length} endpoints, and ${snapshot.dashboardSections.length} sections match snapshot.`);
} catch (error) {
  console.error("[platform-admin:contract-parity] Contract parity check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
