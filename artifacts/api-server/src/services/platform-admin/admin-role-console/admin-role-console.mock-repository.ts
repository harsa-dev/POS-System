import type { AdminRoleConsoleOverviewDto, AdminRoleConsoleSectionKey, AdminRoleConsoleSectionStateDto } from "./admin-role-console.types.js";

const sectionLabels: Record<AdminRoleConsoleSectionKey, string> = {
  "console-card": "Console card",
  metrics: "Metrics",
  workflows: "Workflows",
  "rollout-preview": "Read-only rollout preview",
  "schema-candidates": "Schema candidates",
};

function section(key: AdminRoleConsoleSectionKey, records: number): AdminRoleConsoleSectionStateDto {
  return {
    key,
    label: sectionLabels[key],
    source: "api",
    fallback: false,
    records,
    note: "Loaded from backend read-only mock repository.",
  };
}

export function getAdminRoleConsoleMockOverview(): AdminRoleConsoleOverviewDto {
  const generatedAt = new Date().toISOString();

  return {
    consoleId: "admin-role-console",
    source: "api",
    generatedAt,
    summary: {
      metrics: 2,
      workflows: 2,
      readinessItems: 1,
      schemaCandidates: 1,
      blockedWriteItems: 0,
    },
    sectionFallbacks: [
      section("console-card", 1),
      section("metrics", 2),
      section("workflows", 2),
      section("rollout-preview", 1),
      section("schema-candidates", 1),
    ],
    consoleCard: {
      id: "admin-role-console",
      title: "Admin Role Console",
      ownerRole: "SUPER_ADMIN",
      mission: "Read-only governance overview for platform administrators.",
      primaryJobs: "Review access posture and planning readiness.",
      blockedScope: "Planning-only read surface.",
      readiness: "Ready Mock",
      risk: "High",
    },
    metrics: [
      { id: "active-admins", consoleId: "admin-role-console", label: "Active Internal Admins", value: "7", note: "Backend mock snapshot.", status: "Ready Mock" },
      { id: "access-review", consoleId: "admin-role-console", label: "Access Reviews", value: "3 pending", note: "Backend mock snapshot.", status: "Draft" },
    ],
    workflows: [
      { id: "template-review", consoleId: "admin-role-console", workflow: "Template review", actor: "Platform Admin", currentMockStep: "Compare template", futureAutomation: "Validate registry", requiredGuardrail: "Review required", status: "Draft" },
      { id: "access-review", consoleId: "admin-role-console", workflow: "Access review", actor: "Platform Admin", currentMockStep: "Review account", futureAutomation: "Detect stale records", requiredGuardrail: "Evidence required", status: "Needs API" },
    ],
    rolloutPreview: [
      { id: "api-admin-roles", consoleId: "admin-role-console", method: "GET", endpoint: "/api/internal/admin-console/roles", purpose: "Read overview data.", authRule: "platform-admin.admin-role-console.read", responseShape: "AdminRoleConsoleOverviewDto", blockedBy: "Real source not wired.", status: "Ready Mock" },
    ],
    schemaCandidates: [
      { id: "schema-admin-role-policy", consoleId: "admin-role-console", model: "AdminRolePolicy", purpose: "Later persistence candidate.", candidateFields: "id, roleKey, permissionKeys, riskLevel", promoteWhen: "Real access review needs persistence.", risk: "High" },
    ],
    blockedWriteItems: 0,
  };
}
