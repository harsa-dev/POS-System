#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
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

function assertFileExists(path) {
  if (!existsSync(resolve(rootDir, path))) {
    fail(`Expected file to exist: ${path}`);
  }
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
  const typePattern = new RegExp(`export\\s+type\\s+${typeName}(?:<[^>]+>)?\\s*=\\s*{([\\s\\S]*?)\\n};`);
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

function assertResponseEnvelope({ snapshot, frontendDto, backendDto, frontendApi, frontendDataSource, backendResponseHelper, backendPolicy, backendRoute }) {
  for (const field of snapshot.responseEnvelope.successFields) {
    assertDtoFields({ label: "frontend success envelope", content: frontendDto, typeName: "InternalMonitoringApiSuccessEnvelopeDto", fields: [field] });
    assertDtoFields({ label: "backend success envelope", content: backendDto, typeName: "InternalMonitoringApiSuccessEnvelopeDto", fields: [field] });
  }

  for (const field of snapshot.responseEnvelope.errorFields) {
    assertDtoFields({ label: "frontend error envelope", content: frontendDto, typeName: "InternalMonitoringApiErrorEnvelopeDto", fields: [field] });
    assertDtoFields({ label: "backend error envelope", content: backendDto, typeName: "InternalMonitoringApiErrorEnvelopeDto", fields: [field] });
  }

  for (const field of snapshot.responseEnvelope.metaFields) {
    assertDtoFields({ label: "frontend meta envelope", content: frontendDto, typeName: "InternalMonitoringApiMetaDto", fields: [field] });
    assertDtoFields({ label: "backend meta envelope", content: backendDto, typeName: "InternalMonitoringApiMetaDto", fields: [field] });
  }

  for (const field of snapshot.responseEnvelope.requiredMetaFields) {
    assertContains({ label: "backend response helper required meta", content: backendResponseHelper, expected: field });
  }

  assertContains({ label: "frontend api envelope usage", content: frontendApi, expected: "InternalMonitoringApiEnvelopeDto" });
  assertContains({ label: "frontend data source envelope unwrap", content: frontendDataSource, expected: "unwrapInternalMonitoringEnvelope" });
  assertContains({ label: "backend response helper", content: backendResponseHelper, expected: "internalMonitoringSuccessResponse" });
  assertContains({ label: "backend route uses internal monitoring envelope helper", content: backendRoute, expected: "internalMonitoringSuccessResponse" });
  assertContains({ label: "backend route no direct generic success response", content: backendRoute, expected: "internal-monitoring-response.js" });
  assertContains({ label: "backend response helper read-only value", content: backendResponseHelper, expected: "readOnly: true" });
  assertContains({ label: "backend response helper policy capability indirection", content: backendResponseHelper, expected: "capability: INTERNAL_MONITORING_POLICY.capability" });
  assertContains({ label: "backend policy capability value", content: backendPolicy, expected: snapshot.responseEnvelope.capabilityValue });
}

function assertRuntimeProbes({ snapshot, backendRuntimeProbes, backendService, backendRoute, frontendDto, frontendDataSource }) {
  assertContains({ label: "runtime probe collector", content: backendRuntimeProbes, expected: "collectInternalMonitoringRuntimeProbes" });
  assertContains({ label: "runtime probe collector database ping", content: backendRuntimeProbes, expected: "DATABASE_URL" });
  assertContains({ label: "runtime probe collector database query", content: backendRuntimeProbes, expected: "select 1 as internal_monitoring_probe" });

  for (const probeId of snapshot.runtimeProbeIds) {
    assertContains({ label: `runtime probe id ${probeId}`, content: backendRuntimeProbes, expected: probeId });
  }

  assertContains({ label: "backend service runtime probe collector usage", content: backendService, expected: "collectInternalMonitoringRuntimeProbes" });
  assertContains({ label: "backend service runtime probe payload", content: backendService, expected: "runtimeProbes" });
  assertContains({ label: "backend health route awaits runtime probe payload", content: backendRoute, expected: "await getInternalMonitoringControlRoom()" });
  assertDtoFields({ label: "frontend runtime probe dto", content: frontendDto, typeName: "InternalMonitoringRuntimeProbeDto", fields: snapshot.dtoTypes.InternalMonitoringRuntimeProbeDto });
  assertDtoFields({ label: "frontend control room dto runtime probes", content: frontendDto, typeName: "InternalMonitoringControlRoomDto", fields: ["runtimeProbes"] });
  assertContains({ label: "frontend fallback runtime probes", content: frontendDataSource, expected: "mockRuntimeProbes" });
}

function assertProbeHistory({ snapshot, backendProbeHistory, probeMigration, frontendApi, frontendDataSource, controlRoom }) {
  assertFileExists(snapshot.sourceFiles.backendProbeHistory);
  assertFileExists(snapshot.sourceFiles.probeMigration);

  assertContains({ label: "probe migration table", content: probeMigration, expected: "internal_system_probes" });
  assertContains({ label: "probe migration status check", content: probeMigration, expected: "internal_system_probes_status_check" });
  assertContains({ label: "probe migration probe observed index", content: probeMigration, expected: "internal_system_probes_probe_id_observed_at_idx" });

  assertContains({ label: "backend probe history reader", content: backendProbeHistory, expected: "getInternalSystemProbeHistory" });
  assertContains({ label: "backend probe history table", content: backendProbeHistory, expected: "internal_system_probes" });
  assertContains({ label: "backend probe history retention", content: backendProbeHistory, expected: "RETENTION_DAYS" });
  assertContains({ label: "backend probe history missing table handling", content: backendProbeHistory, expected: "schema-missing" });
  assertContains({ label: "frontend probe history api", content: frontendApi, expected: "getProbeHistory" });
  assertContains({ label: "frontend probe history data source", content: frontendDataSource, expected: "probeHistory" });
  assertContains({ label: "frontend probe history panel", content: controlRoom, expected: "InternalSystemProbe History" });
  assertContains({ label: "frontend probe history panel status", content: controlRoom, expected: "Persistence Status" });
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
const backendResponseHelper = read(snapshot.sourceFiles.backendResponseHelper);
const backendRuntimeProbes = read(snapshot.sourceFiles.backendRuntimeProbes);
const backendProbeHistory = read(snapshot.sourceFiles.backendProbeHistory);
const probeMigration = read(snapshot.sourceFiles.probeMigration);
const frontendPolicy = read("artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts");
const sidebarRegistry = read("artifacts/pos-system/src/app/registry/core-modules.ts");
const app = read("artifacts/pos-system/src/App.tsx");
const controlRoom = read("artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx");
const backendService = read("artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.service.ts");

try {
  assertContains({ label: "snapshot", content: read(snapshotPath), expected: "InternalMonitoringMutationReadinessContractDto" });
  assertContains({ label: "snapshot", content: read(snapshotPath), expected: "InternalSystemProbeHistoryDto" });

  if (snapshot.readOnly !== true) fail("Contract snapshot must remain readOnly: true.");
  if (snapshot.mutationMode !== "design-only") fail("Contract snapshot mutationMode must remain design-only.");

  for (const [typeName, fields] of Object.entries(snapshot.dtoTypes)) {
    assertDtoFields({ label: "frontend DTO", content: frontendDto, typeName, fields });
    assertDtoFields({ label: "backend DTO", content: backendDto, typeName, fields });
  }

  assertResponseEnvelope({ snapshot, frontendDto, backendDto, frontendApi, frontendDataSource, backendResponseHelper, backendPolicy, backendRoute });
  assertRuntimeProbes({ snapshot, backendRuntimeProbes, backendService, backendRoute, frontendDto, frontendDataSource });
  assertProbeHistory({ snapshot, backendProbeHistory, probeMigration, frontendApi, frontendDataSource, controlRoom });

  for (const endpoint of snapshot.endpoints) {
    if (endpoint.method !== "GET") fail(`Endpoint ${endpoint.id} must remain GET-only in this phase.`);
    assertEndpoint({ snapshotEndpoint: endpoint, frontendApi, backendRoute, backendService });
  }

  for (const section of snapshot.dashboardSections) {
    assertContains({ label: "internal monitoring dashboard section", content: controlRoom, expected: section });
  }

  for (const blockedMutation of snapshot.blockedMutations) {
    assertContains({ label: "backend policy blocked mutation list", content: backendPolicy, expected: blockedMutation });
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

  assertContains({ label: "frontend data source mutation readiness section", content: frontendDataSource, expected: "mutationReadinessContracts" });
  assertContains({ label: "sidebar platform admin capability", content: sidebarRegistry, expected: snapshot.capability });
  assertContains({ label: "App route platform admin capability", content: app, expected: `PlatformAdminProtectedRoute capability="${snapshot.capability}"` });

  console.log(`[platform-admin:contract-parity] ${Object.keys(snapshot.dtoTypes).length} DTOs, ${snapshot.endpoints.length} endpoints, ${snapshot.dashboardSections.length} sections, ${snapshot.runtimeProbeIds.length} runtime probes, probe history, and response envelope fields match snapshot.`);
} catch (error) {
  console.error("[platform-admin:contract-parity] Contract parity check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
