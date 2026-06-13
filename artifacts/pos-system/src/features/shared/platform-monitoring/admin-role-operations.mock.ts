export type AdminRoleKey = "SUPER_ADMIN" | "BILLING_ADMIN" | "SUPPORT_OPS_ADMIN";
export type AdminReadinessStatus = "Ready" | "Draft" | "Gap" | "Blocked";
export type AdminRiskLevel = "Low" | "Medium" | "High" | "Critical";

export type AdminRoleCard = {
  id: AdminRoleKey;
  label: string;
  mission: string;
  allowedScope: string;
  blockedScope: string;
  dailyFocus: string;
  readiness: AdminReadinessStatus;
  risk: AdminRiskLevel;
};

export type AdminPermissionRow = {
  id: string;
  capability: string;
  superAdmin: string;
  billingAdmin: string;
  supportOpsAdmin: string;
  rule: string;
};

export type AdminFeatureGap = {
  id: string;
  feature: string;
  targetRole: string;
  currentState: string;
  neededFor: string;
  futureApi: string;
  futureSchema: string;
  status: AdminReadinessStatus;
};

export type AdminApiContract = {
  id: string;
  method: "GET" | "POST" | "PATCH";
  endpoint: string;
  purpose: string;
  authRule: string;
  responseShape: string;
  blockedBy: string;
  status: AdminReadinessStatus;
};

export type AdminSchemaCandidate = {
  id: string;
  model: string;
  reason: string;
  candidateFields: string;
  promoteWhen: string;
  risk: AdminRiskLevel;
  status: AdminReadinessStatus;
};

export type AdminEscalationRow = {
  id: string;
  scenario: string;
  firstOwner: string;
  escalationOwner: string;
  maxAction: string;
  auditRequirement: string;
};

export const adminRoleCards: AdminRoleCard[] = [
  {
    id: "SUPER_ADMIN",
    label: "Super Admin",
    mission: "Full platform control: tenants, roles, feature flags, internal monitoring, and emergency actions.",
    allowedScope: "Read/write platform settings, role policy, tenant state, internal monitoring, and release gates.",
    blockedScope: "No direct payroll/billing mutation without audit + approval in future production mode.",
    dailyFocus: "Keep platform safe, review critical alerts, approve admin access, and freeze risky releases.",
    readiness: "Draft",
    risk: "Critical",
  },
  {
    id: "BILLING_ADMIN",
    label: "Billing Admin",
    mission: "Handle subscription, invoice, payment status, plan usage, refund review, and billing disputes.",
    allowedScope: "Read tenant billing state, prepare invoices, review failed payments, and request plan changes.",
    blockedScope: "Cannot change platform roles, tenant isolation, schema, feature flags, or security policy.",
    dailyFocus: "Watch unpaid tenants, invoice queue, plan limits, payment failures, and billing approval backlog.",
    readiness: "Gap",
    risk: "High",
  },
  {
    id: "SUPPORT_OPS_ADMIN",
    label: "Support / Ops Admin",
    mission: "Resolve tenant issues: login problems, route access, order flow reports, user lockouts, and smoke checks.",
    allowedScope: "Read tenant health, open support cases, request password/session reset, and view safe diagnostics.",
    blockedScope: "Cannot access billing mutation, schema changes, role assignment, or destructive tenant operations.",
    dailyFocus: "Handle tickets, check tenant health, verify route access, collect logs, and escalate incidents.",
    readiness: "Draft",
    risk: "Medium",
  },
];

export const adminPermissionMatrix: AdminPermissionRow[] = [
  { id: "tenant", capability: "Tenant lifecycle", superAdmin: "Full control", billingAdmin: "Read billing state", supportOpsAdmin: "Read health only", rule: "Tenant suspend/delete must require audit + approval." },
  { id: "billing", capability: "Billing & subscription", superAdmin: "Approve override", billingAdmin: "Primary operator", supportOpsAdmin: "Read limited status", rule: "Refund/plan changes need two-step approval." },
  { id: "support", capability: "Support tickets", superAdmin: "View/escalate", billingAdmin: "Billing tickets only", supportOpsAdmin: "Primary operator", rule: "Support can request reset but not silently mutate account." },
  { id: "roles", capability: "Admin role assignment", superAdmin: "Full control", billingAdmin: "No access", supportOpsAdmin: "No access", rule: "Only Super Admin can grant admin permissions." },
  { id: "monitoring", capability: "Internal monitoring", superAdmin: "Full view", billingAdmin: "Billing/cost view", supportOpsAdmin: "Operational view", rule: "Sensitive security panels hidden from non-super admins." },
  { id: "feature-flags", capability: "Feature flags", superAdmin: "Create/toggle", billingAdmin: "Plan-limit view", supportOpsAdmin: "Read rollout status", rule: "Mutation blocked until audit and rollback exist." },
];

export const adminFeatureGaps: AdminFeatureGap[] = [
  { id: "role-console", feature: "Admin Role Console", targetRole: "Super Admin", currentState: "Only dashboard planning exists", neededFor: "Assign and review admin access safely", futureApi: "GET /api/internal/admin/roles", futureSchema: "AdminRoleAssignment", status: "Gap" },
  { id: "billing-console", feature: "Billing Operations Console", targetRole: "Billing Admin", currentState: "No dedicated billing admin panel", neededFor: "Invoices, plans, unpaid tenants, disputes", futureApi: "GET /api/internal/billing/overview", futureSchema: "BillingAccountSnapshot", status: "Gap" },
  { id: "support-console", feature: "Support / Ops Console", targetRole: "Support / Ops Admin", currentState: "No safe ticket/diagnostic workspace", neededFor: "Tenant issue triage and escalation", futureApi: "GET /api/internal/support/tickets", futureSchema: "SupportTicket", status: "Draft" },
  { id: "admin-audit", feature: "Admin Action Audit", targetRole: "All Admins", currentState: "Audit concept exists, internal admin audit not persisted", neededFor: "Trace every privileged action", futureApi: "GET /api/internal/admin/audit-log", futureSchema: "AdminAuditEvent", status: "Gap" },
  { id: "approval-flow", feature: "Sensitive Action Approval", targetRole: "Super Admin + Billing Admin", currentState: "Approval board exists as mock only", neededFor: "Refunds, suspensions, role grants, feature flag toggles", futureApi: "POST /api/internal/admin/approval-requests", futureSchema: "AdminApprovalRequest", status: "Blocked" },
];

export const adminApiContracts: AdminApiContract[] = [
  { id: "roles", method: "GET", endpoint: "/api/internal/admin/roles", purpose: "List admin roles, permissions, and assignment status.", authRule: "Super Admin only", responseShape: "{ roles, assignments, gaps }", blockedBy: "RBAC middleware not formalized", status: "Draft" },
  { id: "billing", method: "GET", endpoint: "/api/internal/billing/overview", purpose: "Show invoice queue, subscriptions, payment failures, and plan limits.", authRule: "Super Admin or Billing Admin", responseShape: "{ invoices, plans, failedPayments, disputes }", blockedBy: "Billing schema not created", status: "Gap" },
  { id: "support", method: "GET", endpoint: "/api/internal/support/tickets", purpose: "Show tenant support tickets and safe diagnostics.", authRule: "Super Admin or Support/Ops Admin", responseShape: "{ tickets, tenantHealth, escalationQueue }", blockedBy: "Ticket schema not created", status: "Gap" },
  { id: "approval", method: "POST", endpoint: "/api/internal/admin/approval-requests", purpose: "Request sensitive action approval.", authRule: "Role-specific, audited, rate-limited", responseShape: "{ requestId, status, requiredApprovers }", blockedBy: "Needs audit write + approval policy", status: "Blocked" },
];

export const adminSchemaCandidates: AdminSchemaCandidate[] = [
  { id: "assignments", model: "AdminRoleAssignment", reason: "Persist who owns platform admin permissions.", candidateFields: "id, userId, roleKey, scope, grantedBy, grantedAt, revokedAt", promoteWhen: "When real internal auth roles exist", risk: "Critical", status: "Draft" },
  { id: "billing-snapshot", model: "BillingAccountSnapshot", reason: "Track tenant billing state without touching payment processor first.", candidateFields: "id, tenantId, plan, status, unpaidAmount, dueDate, lastSyncAt", promoteWhen: "When billing dashboard moves from mock to read-only API", risk: "High", status: "Gap" },
  { id: "support-ticket", model: "SupportTicket", reason: "Centralize tenant issues and support workflow.", candidateFields: "id, tenantId, category, priority, status, ownerId, createdAt, closedAt", promoteWhen: "When support ops dashboard needs persisted tickets", risk: "Medium", status: "Draft" },
  { id: "admin-audit", model: "AdminAuditEvent", reason: "Trace every privileged admin action.", candidateFields: "id, actorId, roleKey, action, targetType, targetId, metadata, createdAt", promoteWhen: "Before any internal POST/PATCH endpoint is enabled", risk: "Critical", status: "Blocked" },
];

export const adminEscalationRows: AdminEscalationRow[] = [
  { id: "failed-payment", scenario: "Tenant has repeated failed payment", firstOwner: "Billing Admin", escalationOwner: "Super Admin", maxAction: "Prepare suspend request only", auditRequirement: "Approval before tenant suspension" },
  { id: "tenant-login", scenario: "Tenant owner cannot login", firstOwner: "Support / Ops Admin", escalationOwner: "Super Admin", maxAction: "Request session reset", auditRequirement: "Log identity check and reset reason" },
  { id: "role-change", scenario: "Admin permission change requested", firstOwner: "Super Admin", escalationOwner: "Second Super Admin future", maxAction: "Grant/revoke admin role", auditRequirement: "AdminAuditEvent required before production" },
  { id: "billing-dispute", scenario: "Customer disputes invoice", firstOwner: "Billing Admin", escalationOwner: "Super Admin", maxAction: "Prepare adjustment request", auditRequirement: "Approval before refund/credit" },
];

export function getAdminRoleSummary() {
  return {
    totalRoles: adminRoleCards.length,
    highRiskRoles: adminRoleCards.filter((role) => role.risk === "High" || role.risk === "Critical").length,
    featureGaps: adminFeatureGaps.filter((gap) => gap.status === "Gap").length,
    blockedItems: [...adminFeatureGaps, ...adminApiContracts, ...adminSchemaCandidates].filter((item) => item.status === "Blocked").length,
  };
}
