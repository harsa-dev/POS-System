export type AdminRoleConsoleSource = "api" | "mock" | "fallback";
export type AdminRoleConsoleMode = "read-only";
export type AdminRoleConsoleStatus = "Ready Mock" | "Draft" | "Blocked" | "Needs API";
export type AdminRoleConsoleRisk = "Low" | "Medium" | "High" | "Critical";

export type AdminRoleConsoleCardDto = {
  id: "admin-role-console";
  title: string;
  ownerRole: "SUPER_ADMIN";
  mission: string;
  primaryJobs: string;
  blockedScope: string;
  readiness: AdminRoleConsoleStatus;
  risk: AdminRoleConsoleRisk;
};

export type AdminRoleConsoleMetricDto = {
  id: string;
  consoleId: "admin-role-console";
  label: string;
  value: string;
  note: string;
  status: AdminRoleConsoleStatus;
};

export type AdminRoleConsoleWorkflowDto = {
  id: string;
  consoleId: "admin-role-console";
  workflow: string;
  actor: string;
  currentMockStep: string;
  futureAutomation: string;
  requiredGuardrail: string;
  status: AdminRoleConsoleStatus;
};

export type AdminRoleConsoleReadinessItemDto = {
  id: string;
  consoleId: "admin-role-console";
  method: "GET" | "POST" | "PATCH";
  endpoint: string;
  purpose: string;
  authRule: string;
  responseShape: string;
  blockedBy: string;
  status: AdminRoleConsoleStatus;
};

export type AdminRoleConsoleSchemaCandidateDto = {
  id: string;
  consoleId: "admin-role-console";
  model: string;
  purpose: string;
  candidateFields: string;
  promoteWhen: string;
  risk: AdminRoleConsoleRisk;
};

export type AdminRoleConsoleSectionKey = "console-card" | "metrics" | "workflows" | "rollout-preview" | "schema-candidates";

export type AdminRoleConsoleSectionStateDto = {
  key: AdminRoleConsoleSectionKey;
  label: string;
  source: AdminRoleConsoleSource;
  fallback: boolean;
  records: number;
  note: string;
};

export type AdminRoleConsoleSummaryDto = {
  metrics: number;
  workflows: number;
  readinessItems: number;
  schemaCandidates: number;
  blockedWriteItems: number;
};

export type AdminRoleConsoleOverviewDto = {
  consoleId: "admin-role-console";
  source: AdminRoleConsoleSource;
  generatedAt: string;
  summary: AdminRoleConsoleSummaryDto;
  sectionFallbacks: AdminRoleConsoleSectionStateDto[];
  consoleCard: AdminRoleConsoleCardDto;
  metrics: AdminRoleConsoleMetricDto[];
  workflows: AdminRoleConsoleWorkflowDto[];
  rolloutPreview: AdminRoleConsoleReadinessItemDto[];
  schemaCandidates: AdminRoleConsoleSchemaCandidateDto[];
  blockedWriteItems: number;
};

export type AdminRoleConsoleApiMetaDto = {
  generatedAt: string;
  source: AdminRoleConsoleSource;
  mock: boolean;
  mode: AdminRoleConsoleMode;
  capability: string;
  readOnly: true;
};
