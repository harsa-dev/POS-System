export type InternalAdminConsoleId =
  | "admin-role-console"
  | "billing-operations-console"
  | "support-ops-console"
  | "admin-action-audit"
  | "sensitive-action-approval";

export type ConsoleStatus = "Ready Mock" | "Draft" | "Blocked" | "Needs API";
export type ConsoleRisk = "Low" | "Medium" | "High" | "Critical";

export type InternalAdminConsoleCard = {
  id: InternalAdminConsoleId;
  title: string;
  ownerRole: "SUPER_ADMIN" | "BILLING_ADMIN" | "SUPPORT_OPS_ADMIN" | "SHARED_CONTROL";
  mission: string;
  primaryJobs: string;
  blockedScope: string;
  readiness: ConsoleStatus;
  risk: ConsoleRisk;
};

export type InternalAdminMetric = {
  id: string;
  consoleId: InternalAdminConsoleId;
  label: string;
  value: string;
  note: string;
  status: ConsoleStatus;
};

export type InternalAdminWorkflow = {
  id: string;
  consoleId: InternalAdminConsoleId;
  workflow: string;
  actor: string;
  currentMockStep: string;
  futureAutomation: string;
  requiredGuardrail: string;
  status: ConsoleStatus;
};

export type InternalAdminApiContract = {
  id: string;
  consoleId: InternalAdminConsoleId;
  method: "GET" | "POST" | "PATCH";
  endpoint: string;
  purpose: string;
  authRule: string;
  responseShape: string;
  blockedBy: string;
  status: ConsoleStatus;
};

export type InternalAdminSchemaCandidate = {
  id: string;
  consoleId: InternalAdminConsoleId;
  model: string;
  purpose: string;
  candidateFields: string;
  promoteWhen: string;
  risk: ConsoleRisk;
};

export type InternalAdminActionRow = {
  id: string;
  consoleId: InternalAdminConsoleId;
  action: string;
  requester: string;
  target: string;
  approvalRule: string;
  rollbackPlan: string;
  risk: ConsoleRisk;
  status: ConsoleStatus;
};

export const internalAdminConsoleCards: InternalAdminConsoleCard[] = [
  {
    id: "admin-role-console",
    title: "Admin Role Console",
    ownerRole: "SUPER_ADMIN",
    mission: "Kelola role internal, permission template, access review, dan policy admin lintas tenant.",
    primaryJobs: "Assign role, revoke access, review stale admin, enforce MFA, prepare permission templates.",
    blockedScope: "Tidak boleh mutate billing, tenant deletion, atau feature flag tanpa approval/audit.",
    readiness: "Ready Mock",
    risk: "High",
  },
  {
    id: "billing-operations-console",
    title: "Billing Operations Console",
    ownerRole: "BILLING_ADMIN",
    mission: "Pantau subscription, invoice, payment health, dispute, dan revenue leakage.",
    primaryJobs: "Review overdue invoice, plan usage, refund request, failed payment, and tax invoice queue.",
    blockedScope: "Tidak boleh assign role, unlock security, toggle feature flag, atau impersonate tenant.",
    readiness: "Ready Mock",
    risk: "Medium",
  },
  {
    id: "support-ops-console",
    title: "Support / Ops Console",
    ownerRole: "SUPPORT_OPS_ADMIN",
    mission: "Bantu tenant secara aman lewat diagnostic read-only, ticket queue, dan controlled reset workflow.",
    primaryJobs: "Check ticket, inspect tenant health, route access issue, login lockout, and guided recovery.",
    blockedScope: "Tidak boleh melihat payment secret, mutate billing, delete tenant, atau bypass approval.",
    readiness: "Ready Mock",
    risk: "Medium",
  },
  {
    id: "admin-action-audit",
    title: "Admin Action Audit",
    ownerRole: "SHARED_CONTROL",
    mission: "Audit semua aksi admin sensitif dengan risk level, actor, target, retention, dan evidence trail.",
    primaryJobs: "Track action log, detect suspicious changes, verify approval link, prepare export evidence.",
    blockedScope: "Tidak boleh bisa diedit manual; future storage harus append-only dan immutable.",
    readiness: "Needs API",
    risk: "Critical",
  },
  {
    id: "sensitive-action-approval",
    title: "Sensitive Action Approval",
    ownerRole: "SHARED_CONTROL",
    mission: "Gate untuk aksi berisiko seperti suspend tenant, role elevation, refund besar, dan feature rollout.",
    primaryJobs: "Review request, require second approver, check dry-run, set expiry, attach rollback plan.",
    blockedScope: "Tidak boleh execute mutation sampai RBAC, audit write, rate limit, dan rollback notes siap.",
    readiness: "Draft",
    risk: "Critical",
  },
];

export const internalAdminMetrics: InternalAdminMetric[] = [
  { id: "role-active", consoleId: "admin-role-console", label: "Active Internal Admins", value: "7", note: "2 super, 2 billing, 3 support/ops.", status: "Ready Mock" },
  { id: "role-review", consoleId: "admin-role-console", label: "Access Reviews", value: "3 pending", note: "Quarterly review simulation.", status: "Draft" },
  { id: "billing-mrr", consoleId: "billing-operations-console", label: "Mock MRR", value: "Rp 42.8M", note: "Dummy subscription snapshot.", status: "Ready Mock" },
  { id: "billing-risk", consoleId: "billing-operations-console", label: "Payment Risk", value: "11 tenants", note: "Overdue, failed, or disputed.", status: "Needs API" },
  { id: "support-open", consoleId: "support-ops-console", label: "Open Tickets", value: "18", note: "4 high priority dummy cases.", status: "Ready Mock" },
  { id: "support-sla", consoleId: "support-ops-console", label: "SLA Risk", value: "2 breach risk", note: "Login lockout and payment confusion.", status: "Needs API" },
  { id: "audit-events", consoleId: "admin-action-audit", label: "Audit Events", value: "124", note: "Mock internal action feed.", status: "Needs API" },
  { id: "approval-queue", consoleId: "sensitive-action-approval", label: "Approval Queue", value: "9", note: "Suspend, refund, role elevation.", status: "Draft" },
];

export const internalAdminWorkflows: InternalAdminWorkflow[] = [
  { id: "wf-role-template", consoleId: "admin-role-console", workflow: "Create permission template", actor: "Super Admin", currentMockStep: "Draft template comparison", futureAutomation: "Validate against permission registry", requiredGuardrail: "Two-person review for high-risk grants", status: "Draft" },
  { id: "wf-role-revoke", consoleId: "admin-role-console", workflow: "Revoke stale admin", actor: "Super Admin", currentMockStep: "Mark stale account", futureAutomation: "Auto-detect inactive admins", requiredGuardrail: "Audit event + notify owner", status: "Needs API" },
  { id: "wf-billing-overdue", consoleId: "billing-operations-console", workflow: "Review overdue tenant", actor: "Billing Admin", currentMockStep: "Flag tenant invoice", futureAutomation: "Payment provider webhook sync", requiredGuardrail: "No tenant suspend without approval", status: "Ready Mock" },
  { id: "wf-billing-refund", consoleId: "billing-operations-console", workflow: "Refund request review", actor: "Billing Admin", currentMockStep: "Refund impact note", futureAutomation: "Provider refund dry-run", requiredGuardrail: "Approval above threshold", status: "Draft" },
  { id: "wf-support-login", consoleId: "support-ops-console", workflow: "Resolve owner login lockout", actor: "Support/Ops", currentMockStep: "Read-only tenant diagnostic", futureAutomation: "Safe reset request", requiredGuardrail: "No password reveal; reset link only", status: "Ready Mock" },
  { id: "wf-support-route", consoleId: "support-ops-console", workflow: "Route access troubleshooting", actor: "Support/Ops", currentMockStep: "Compare mode and permission", futureAutomation: "Route guard trace", requiredGuardrail: "No permission mutation", status: "Needs API" },
  { id: "wf-audit-export", consoleId: "admin-action-audit", workflow: "Export audit evidence", actor: "Super Admin", currentMockStep: "Mock event list", futureAutomation: "Signed export bundle", requiredGuardrail: "Immutable audit storage", status: "Blocked" },
  { id: "wf-sensitive-suspend", consoleId: "sensitive-action-approval", workflow: "Approve tenant suspension", actor: "Shared Control", currentMockStep: "Approval card only", futureAutomation: "Dry-run then execute mutation", requiredGuardrail: "Second approver + rollback note", status: "Blocked" },
];

export const internalAdminApiContracts: InternalAdminApiContract[] = [
  { id: "api-admin-roles", consoleId: "admin-role-console", method: "GET", endpoint: "/api/internal/admin-console/roles", purpose: "List admin roles, permission templates, and stale access.", authRule: "SUPER_ADMIN only", responseShape: "{ roles, templates, staleAccess }", blockedBy: "Need permission registry source", status: "Draft" },
  { id: "api-admin-role-request", consoleId: "admin-role-console", method: "POST", endpoint: "/api/internal/admin-console/role-requests", purpose: "Request role assignment or revocation.", authRule: "SUPER_ADMIN + approval", responseShape: "{ requestId, status, auditId }", blockedBy: "Approval + audit write", status: "Blocked" },
  { id: "api-billing-overview", consoleId: "billing-operations-console", method: "GET", endpoint: "/api/internal/billing/operations/overview", purpose: "Read subscription health, invoice queue, failed payments, and plan usage.", authRule: "BILLING_ADMIN or SUPER_ADMIN", responseShape: "{ accounts, invoices, usage, disputes }", blockedBy: "Billing provider adapter", status: "Draft" },
  { id: "api-support-tickets", consoleId: "support-ops-console", method: "GET", endpoint: "/api/internal/support/ops/tickets", purpose: "Read support queue and tenant diagnostic summary.", authRule: "SUPPORT_OPS_ADMIN or SUPER_ADMIN", responseShape: "{ tickets, diagnostics, sla }", blockedBy: "Support ticket source", status: "Draft" },
  { id: "api-audit-actions", consoleId: "admin-action-audit", method: "GET", endpoint: "/api/internal/audit/admin-actions", purpose: "Read append-only admin action feed.", authRule: "SUPER_ADMIN + audit.view", responseShape: "{ events, filters, retention }", blockedBy: "Append-only audit table", status: "Needs API" },
  { id: "api-sensitive-approvals", consoleId: "sensitive-action-approval", method: "GET", endpoint: "/api/internal/approvals/sensitive-actions", purpose: "Read sensitive action approval queue.", authRule: "SUPER_ADMIN + approval.view", responseShape: "{ requests, policies, approvers }", blockedBy: "Approval model", status: "Draft" },
  { id: "api-sensitive-approve", consoleId: "sensitive-action-approval", method: "PATCH", endpoint: "/api/internal/approvals/sensitive-actions/:id", purpose: "Approve, reject, expire, or request revision.", authRule: "Two-person approval policy", responseShape: "{ requestId, decision, auditId }", blockedBy: "RBAC + audit + rate limit + rollback plan", status: "Blocked" },
];

export const internalAdminSchemaCandidates: InternalAdminSchemaCandidate[] = [
  { id: "schema-admin-role-policy", consoleId: "admin-role-console", model: "AdminRolePolicy", purpose: "Store internal role templates and permission bundles.", candidateFields: "id, roleKey, permissionKeys, riskLevel, createdBy, reviewedAt", promoteWhen: "Permission registry stabilizes and access review is needed.", risk: "High" },
  { id: "schema-billing-account", consoleId: "billing-operations-console", model: "BillingAccountSnapshot", purpose: "Cache billing health and invoice risk per tenant.", candidateFields: "id, tenantId, planKey, mrr, paymentStatus, overdueDays, providerRef", promoteWhen: "Provider adapter exists or billing mock becomes real.", risk: "Medium" },
  { id: "schema-support-ticket", consoleId: "support-ops-console", model: "SupportTicket", purpose: "Track tenant issues and internal support workflow.", candidateFields: "id, tenantId, category, priority, status, ownerId, slaDueAt", promoteWhen: "Support queue needs persistence.", risk: "Medium" },
  { id: "schema-admin-audit", consoleId: "admin-action-audit", model: "AdminActionAudit", purpose: "Append-only evidence for every sensitive admin action.", candidateFields: "id, actorId, roleKey, action, targetType, targetId, riskLevel, hash", promoteWhen: "Any admin mutation endpoint is built.", risk: "Critical" },
  { id: "schema-sensitive-approval", consoleId: "sensitive-action-approval", model: "SensitiveActionApproval", purpose: "Gate destructive or sensitive internal actions.", candidateFields: "id, requesterId, approverId, actionKey, status, expiresAt, rollbackPlan", promoteWhen: "First real PATCH/POST internal action is implemented.", risk: "Critical" },
];

export const internalAdminActionRows: InternalAdminActionRow[] = [
  { id: "action-role-elevation", consoleId: "admin-role-console", action: "Role elevation request", requester: "Super Admin A", target: "Support Admin → Billing Admin", approvalRule: "Second Super Admin required", rollbackPlan: "Revoke role and notify owner", risk: "High", status: "Draft" },
  { id: "action-refund-large", consoleId: "billing-operations-console", action: "Refund above threshold", requester: "Billing Admin", target: "Tenant INV-2091", approvalRule: "Super Admin approval", rollbackPlan: "Provider reversal note", risk: "High", status: "Draft" },
  { id: "action-owner-reset", consoleId: "support-ops-console", action: "Owner account recovery", requester: "Support/Ops", target: "Tenant owner login", approvalRule: "Support lead review", rollbackPlan: "Invalidate reset link", risk: "Medium", status: "Ready Mock" },
  { id: "action-export-audit", consoleId: "admin-action-audit", action: "Audit evidence export", requester: "Super Admin", target: "Admin action feed", approvalRule: "Audit view permission", rollbackPlan: "Export cannot mutate source", risk: "Medium", status: "Needs API" },
  { id: "action-suspend-tenant", consoleId: "sensitive-action-approval", action: "Tenant suspension", requester: "Super Admin", target: "Tenant RT-042", approvalRule: "Two-person approval + reason", rollbackPlan: "Reactivate tenant and record incident", risk: "Critical", status: "Blocked" },
];

export function getInternalAdminConsoleSummary() {
  return {
    consoles: internalAdminConsoleCards.length,
    blockedApis: internalAdminApiContracts.filter((item) => item.status === "Blocked").length,
    criticalSchemas: internalAdminSchemaCandidates.filter((item) => item.risk === "Critical").length,
    sensitiveActions: internalAdminActionRows.length,
  };
}
