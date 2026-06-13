import type { InternalAdminConsoleId } from "./internal-admin-consoles.mock";

export type AdminImplementationPhaseStatus = "implemented" | "planned";

export type AdminImplementationPhase = {
  id: string;
  phase: string;
  status: AdminImplementationPhaseStatus;
  scope: string;
  adminConsoleImpact: string;
  backendImpact: string;
  dashboardEvidence: string;
  nextAction: string;
};

export type AdminConsolePhaseCoverage = {
  id: string;
  consoleId: InternalAdminConsoleId;
  consoleName: string;
  implementedCoverage: string;
  plannedCoverage: string;
  backendReadiness: string;
  hardRule: string;
};

export const adminImplementationPhases: AdminImplementationPhase[] = [
  {
    id: "phase-1-persistence-foundation",
    phase: "Phase 1 - Persistence foundation",
    status: "implemented",
    scope: "Prepare platform API package, backend contract map, DTO names, query keys, and schema candidates without running Prisma migrations.",
    adminConsoleImpact: "All five admin consoles now have mock data, future API contracts, schema candidates, and backend readiness mapping.",
    backendImpact: "Read-only backend foundation can serve mock responses first, then move to persistent storage later.",
    dashboardEvidence: "Backend Wiring Readiness panel + Future API Contracts + Schema Candidates.",
    nextAction: "Promote read-only GET handlers before any POST or PATCH route.",
  },
  {
    id: "phase-2-workflow-guard-transition-preview",
    phase: "Phase 2 - Workflow guard and transition preview",
    status: "implemented",
    scope: "Preview admin workflow states, blocked scopes, sensitive actions, approval rules, rollback plans, and guardrails.",
    adminConsoleImpact: "Each admin console shows workflow rows and sensitive action rows before real execution exists.",
    backendImpact: "Write APIs remain blocked until approval, audit, RBAC, rate limit, and rollback notes exist.",
    dashboardEvidence: "Console Workflows + Sensitive Actions + Backend readiness marks write routes as blocked.",
    nextAction: "Keep mutation endpoints returning blocked/501 until guardrails are real.",
  },
  {
    id: "phase-3-service-layer-split",
    phase: "Phase 3 - Service layer split",
    status: "planned",
    scope: "Split backend into admin role, billing, support, audit, and approval services.",
    adminConsoleImpact: "Each console gets a dedicated service boundary instead of one giant internal handler.",
    backendImpact: "Create service modules behind the platform API and keep controllers thin.",
    dashboardEvidence: "Backend Contract Map already defines controller targets per console.",
    nextAction: "Create read-only service functions that return the same DTO shape as the mock dashboard.",
  },
  {
    id: "phase-4-permission-hardening",
    phase: "Phase 4 - Permission hardening",
    status: "planned",
    scope: "Add server-side role checks for Super Admin, Billing Admin, Support/Ops Admin, audit.view, and approval.view.",
    adminConsoleImpact: "Consoles stop being merely visible UI and start enforcing role boundaries server-side.",
    backendImpact: "Every internal endpoint must validate role, scope, tenant/platform boundary, and request intent.",
    dashboardEvidence: "Scope Boundary + Auth Rule + Access Rule columns already define the expected policy.",
    nextAction: "Implement read-only guards first, then block write guards until audit exists.",
  },
  {
    id: "phase-5-audit-integration",
    phase: "Phase 5 - Audit integration",
    status: "planned",
    scope: "Add append-only audit storage for admin reads that expose sensitive diagnostics and every future admin mutation.",
    adminConsoleImpact: "Admin Action Audit becomes backed by real immutable events instead of mock rows.",
    backendImpact: "Create audit append service before allowing role changes, refund requests, tenant suspension, or approval decisions.",
    dashboardEvidence: "Admin Action Audit console and audit-related schema candidate already exist.",
    nextAction: "Promote AdminActionAudit schema only when the first internal mutation is about to be built.",
  },
  {
    id: "phase-6-shared-dashboard-backend-summary",
    phase: "Phase 6 - Shared dashboard backend summary",
    status: "planned",
    scope: "Expose backend summary endpoints for admin console metrics, workflow counts, approval queues, and risk snapshots.",
    adminConsoleImpact: "Dashboard cards can move from local mock data to GET API summaries.",
    backendImpact: "Add summary endpoints that aggregate service results without exposing mutation endpoints.",
    dashboardEvidence: "Console Metrics and Backend Wiring Readiness already show the summary shape.",
    nextAction: "Wire frontend fetcher to GET endpoints while keeping mock fallback available.",
  },
  {
    id: "phase-7-prisma-schema-delegate-cleanup",
    phase: "Phase 7 - Prisma schema delegate cleanup",
    status: "planned",
    scope: "Only after services and permissions are stable, promote schema candidates and clean Prisma delegates.",
    adminConsoleImpact: "Admin consoles become backed by persisted models without mixing billing/support/audit responsibilities.",
    backendImpact: "Separate Prisma access through dedicated repository modules per console domain.",
    dashboardEvidence: "Schema Candidates table already states promoteWhen and risk per model.",
    nextAction: "Do not modify schema until read-only service layer and permission hardening are done.",
  },
];

export const adminConsolePhaseCoverage: AdminConsolePhaseCoverage[] = [
  {
    id: "coverage-role-console",
    consoleId: "admin-role-console",
    consoleName: "Admin Role Console",
    implementedCoverage: "Persistence foundation, workflow guard preview, backend contract map.",
    plannedCoverage: "Role service split, server-side SUPER_ADMIN checks, admin role audit events.",
    backendReadiness: "GET roles is ready for mock API; POST role request stays blocked.",
    hardRule: "No role elevation mutation before two-person approval and audit append exist.",
  },
  {
    id: "coverage-billing-console",
    consoleId: "billing-operations-console",
    consoleName: "Billing Operations Console",
    implementedCoverage: "Billing mock metrics, billing workflow preview, read-only contract target.",
    plannedCoverage: "Billing service split, billing provider adapter, billing snapshot persistence.",
    backendReadiness: "GET billing overview can be promoted first; refund mutation stays blocked.",
    hardRule: "Billing Admin cannot mutate role/security or bypass tenant approval.",
  },
  {
    id: "coverage-support-console",
    consoleId: "support-ops-console",
    consoleName: "Support / Ops Console",
    implementedCoverage: "Support queue mock, diagnostic workflow preview, safe recovery action row.",
    plannedCoverage: "Support service split, support ticket persistence, diagnostic read audit.",
    backendReadiness: "GET support queue can be promoted first; recovery action must escalate.",
    hardRule: "Support/Ops cannot mutate billing, role, security, or destructive tenant actions.",
  },
  {
    id: "coverage-audit-console",
    consoleId: "admin-action-audit",
    consoleName: "Admin Action Audit",
    implementedCoverage: "Audit mock feed, audit API contract, append-only schema candidate.",
    plannedCoverage: "Real append-only audit storage, signed export, immutable evidence trail.",
    backendReadiness: "GET audit feed can be mocked; real audit storage is required before writes.",
    hardRule: "Audit rows must never be manually editable.",
  },
  {
    id: "coverage-approval-console",
    consoleId: "sensitive-action-approval",
    consoleName: "Sensitive Action Approval",
    implementedCoverage: "Approval queue mock, approval rules, blocked PATCH contract.",
    plannedCoverage: "Approval policy service, second approver validation, rollback note enforcement.",
    backendReadiness: "GET approval queue can be promoted first; PATCH decision stays blocked.",
    hardRule: "No sensitive mutation without RBAC, audit, approval, rate limit, and rollback note.",
  },
];

export function getAdminImplementationSummary() {
  return {
    total: adminImplementationPhases.length,
    implemented: adminImplementationPhases.filter((phase) => phase.status === "implemented").length,
    planned: adminImplementationPhases.filter((phase) => phase.status === "planned").length,
  };
}
