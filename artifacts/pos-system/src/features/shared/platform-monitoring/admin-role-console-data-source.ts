import { adminRoleConsoleApi } from "@/lib/api/admin-role-console-api";

import {
  internalAdminApiContracts,
  internalAdminConsoleCards,
  internalAdminMetrics,
  internalAdminSchemaCandidates,
  internalAdminWorkflows,
  type InternalAdminApiContract,
  type InternalAdminConsoleCard,
  type InternalAdminConsoleId,
  type InternalAdminMetric,
  type InternalAdminSchemaCandidate,
  type InternalAdminWorkflow,
} from "./internal-admin-consoles.mock";

export type AdminRoleConsoleSource = "api" | "mock-registry" | "section-fallback" | "fallback";

export type AdminRoleConsoleSectionKey =
  | "console-card"
  | "metrics"
  | "workflows"
  | "rollout-preview"
  | "schema-candidates";

export type AdminRoleConsoleSectionState = {
  key: AdminRoleConsoleSectionKey;
  label: string;
  source: AdminRoleConsoleSource;
  fallback: boolean;
  records: number;
  note: string;
};

export type AdminRoleConsoleDataSourceResult = {
  consoleId: "admin-role-console";
  source: AdminRoleConsoleSource;
  generatedAt: string;
  sectionFallbacks: AdminRoleConsoleSectionState[];
  consoleCard: InternalAdminConsoleCard;
  metrics: InternalAdminMetric[];
  workflows: InternalAdminWorkflow[];
  rolloutPreview: InternalAdminApiContract[];
  schemaCandidates: InternalAdminSchemaCandidate[];
  blockedWriteItems: number;
};

const ADMIN_ROLE_CONSOLE_ID = "admin-role-console" as const satisfies InternalAdminConsoleId;

export const adminRoleConsoleSectionLabels: Record<AdminRoleConsoleSectionKey, string> = {
  "console-card": "Console card",
  metrics: "Metrics",
  workflows: "Workflows",
  "rollout-preview": "Read-only rollout preview",
  "schema-candidates": "Schema candidates",
};

const fallbackConsoleCard: InternalAdminConsoleCard = {
  id: ADMIN_ROLE_CONSOLE_ID,
  title: "Admin Role Console",
  ownerRole: "SUPER_ADMIN",
  mission: "Read-only planning console for internal admin role governance.",
  primaryJobs: "Review internal admin role posture, access review readiness, and permission-template planning.",
  blockedScope: "No role assignment, revocation, permission template writes, approval execution, or database changes in this phase.",
  readiness: "Draft",
  risk: "High",
};

function byAdminRoleConsole<T extends { consoleId: InternalAdminConsoleId }>(items: T[]) {
  return items.filter((item) => item.consoleId === ADMIN_ROLE_CONSOLE_ID);
}

function buildSectionState(
  key: AdminRoleConsoleSectionKey,
  records: number,
  fallback: boolean,
  note: string,
  source: AdminRoleConsoleSource = fallback ? "section-fallback" : "mock-registry",
): AdminRoleConsoleSectionState {
  return {
    key,
    label: adminRoleConsoleSectionLabels[key],
    source,
    fallback,
    records,
    note,
  };
}

function getMockAdminRoleConsoleData(source: AdminRoleConsoleSource = "mock-registry"): AdminRoleConsoleDataSourceResult {
  const consoleCard =
    internalAdminConsoleCards.find((item) => item.id === ADMIN_ROLE_CONSOLE_ID) ?? fallbackConsoleCard;

  const metrics = byAdminRoleConsole(internalAdminMetrics);
  const workflows = byAdminRoleConsole(internalAdminWorkflows);
  const rolloutPreview = byAdminRoleConsole(internalAdminApiContracts);
  const schemaCandidates = byAdminRoleConsole(internalAdminSchemaCandidates);

  const sectionFallbacks: AdminRoleConsoleSectionState[] = [
    buildSectionState(
      "console-card",
      consoleCard === fallbackConsoleCard ? 0 : 1,
      consoleCard === fallbackConsoleCard,
      consoleCard === fallbackConsoleCard
        ? "Console card fallback active; mock registry entry is missing."
        : "Loaded from frontend mock registry.",
      consoleCard === fallbackConsoleCard ? "section-fallback" : source,
    ),
    buildSectionState(
      "metrics",
      metrics.length,
      metrics.length === 0,
      metrics.length === 0 ? "Metrics fallback active; no records in mock registry." : "Metric records loaded from mock registry.",
      metrics.length === 0 ? "section-fallback" : source,
    ),
    buildSectionState(
      "workflows",
      workflows.length,
      workflows.length === 0,
      workflows.length === 0 ? "Workflow fallback active; no records in mock registry." : "Workflow records loaded from mock registry.",
      workflows.length === 0 ? "section-fallback" : source,
    ),
    buildSectionState(
      "rollout-preview",
      rolloutPreview.length,
      rolloutPreview.length === 0,
      rolloutPreview.length === 0
        ? "Rollout preview fallback active; no readiness rows in mock registry."
        : "Read-only rollout preview loaded from mock registry.",
      rolloutPreview.length === 0 ? "section-fallback" : source,
    ),
    buildSectionState(
      "schema-candidates",
      schemaCandidates.length,
      schemaCandidates.length === 0,
      schemaCandidates.length === 0
        ? "Schema candidate fallback active; no candidate rows in mock registry."
        : "Schema candidate records loaded from mock registry.",
      schemaCandidates.length === 0 ? "section-fallback" : source,
    ),
  ];

  return {
    consoleId: ADMIN_ROLE_CONSOLE_ID,
    source: sectionFallbacks.some((section) => section.fallback) ? "section-fallback" : source,
    generatedAt: new Date().toISOString(),
    sectionFallbacks,
    consoleCard,
    metrics,
    workflows,
    rolloutPreview,
    schemaCandidates,
    blockedWriteItems: rolloutPreview.filter((item) => item.method !== "GET" || item.status === "Blocked").length,
  };
}

function unwrapAdminRoleConsoleEnvelope(value: Awaited<ReturnType<typeof adminRoleConsoleApi.getOverview>>) {
  if (!value?.success || !value.data) {
    throw new Error("Invalid Admin Role Console response envelope");
  }

  return value.data;
}

export async function loadAdminRoleConsoleData(): Promise<AdminRoleConsoleDataSourceResult> {
  try {
    const envelope = await adminRoleConsoleApi.getOverview();
    return unwrapAdminRoleConsoleEnvelope(envelope);
  } catch {
    return getMockAdminRoleConsoleData("fallback");
  }
}
