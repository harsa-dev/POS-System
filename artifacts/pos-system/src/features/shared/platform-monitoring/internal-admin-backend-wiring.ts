import type { InternalAdminConsoleId } from "./internal-admin-consoles.mock";

export type BackendReadiness = "Mock Only" | "Read API Ready" | "Write API Blocked";

export type InternalAdminBackendEndpoint = {
  id: string;
  consoleId: InternalAdminConsoleId;
  method: "GET" | "POST" | "PATCH";
  endpoint: string;
  queryKey: string;
  controller: string;
  requestDto: string;
  responseDto: string;
  accessRule: string;
  auditRule: string;
  readiness: BackendReadiness;
  nextStep: string;
};

export const internalAdminBackendEndpoints: InternalAdminBackendEndpoint[] = [
  {
    id: "admin-role-read",
    consoleId: "admin-role-console",
    method: "GET",
    endpoint: "/api/internal/admin/roles",
    queryKey: "internal.admin.roles",
    controller: "InternalAdminRoleController.list",
    requestDto: "ListAdminRolesQueryDto",
    responseDto: "AdminRoleConsoleViewDto",
    accessRule: "SUPER_ADMIN only",
    auditRule: "Read audit optional",
    readiness: "Read API Ready",
    nextStep: "Connect role registry and internal user source.",
  },
  {
    id: "admin-role-request",
    consoleId: "admin-role-console",
    method: "POST",
    endpoint: "/api/internal/admin/role-requests",
    queryKey: "internal.admin.roleRequests",
    controller: "InternalAdminRoleController.requestChange",
    requestDto: "CreateAdminRoleRequestDto",
    responseDto: "AdminRoleRequestDto",
    accessRule: "SUPER_ADMIN + second approval",
    auditRule: "Required audit event",
    readiness: "Write API Blocked",
    nextStep: "Enable only after approval queue and audit storage exist.",
  },
  {
    id: "billing-overview",
    consoleId: "billing-operations-console",
    method: "GET",
    endpoint: "/api/internal/billing/overview",
    queryKey: "internal.billing.overview",
    controller: "InternalBillingController.overview",
    requestDto: "BillingOverviewQueryDto",
    responseDto: "BillingOperationsConsoleViewDto",
    accessRule: "BILLING_ADMIN or SUPER_ADMIN",
    auditRule: "Read audit for export only",
    readiness: "Read API Ready",
    nextStep: "Connect billing provider adapter or cached billing snapshot.",
  },
  {
    id: "support-queue",
    consoleId: "support-ops-console",
    method: "GET",
    endpoint: "/api/internal/support/queue",
    queryKey: "internal.support.queue",
    controller: "InternalSupportController.queue",
    requestDto: "SupportQueueQueryDto",
    responseDto: "SupportOpsConsoleViewDto",
    accessRule: "SUPPORT_OPS_ADMIN or SUPER_ADMIN",
    auditRule: "Read audit when diagnostic is opened",
    readiness: "Read API Ready",
    nextStep: "Connect support ticket source and tenant diagnostic adapter.",
  },
  {
    id: "admin-audit-feed",
    consoleId: "admin-action-audit",
    method: "GET",
    endpoint: "/api/internal/admin/action-audit",
    queryKey: "internal.admin.actionAudit",
    controller: "InternalAdminAuditController.feed",
    requestDto: "AdminAuditFeedQueryDto",
    responseDto: "AdminActionAuditConsoleViewDto",
    accessRule: "SUPER_ADMIN + audit.view",
    auditRule: "Append-only source",
    readiness: "Read API Ready",
    nextStep: "Back with append-only audit table before any admin mutation.",
  },
  {
    id: "approval-queue",
    consoleId: "sensitive-action-approval",
    method: "GET",
    endpoint: "/api/internal/approvals/sensitive-actions",
    queryKey: "internal.approvals.sensitiveActions",
    controller: "InternalApprovalController.queue",
    requestDto: "SensitiveActionApprovalQueryDto",
    responseDto: "SensitiveActionApprovalConsoleViewDto",
    accessRule: "SUPER_ADMIN + approval.view",
    auditRule: "Read audit required",
    readiness: "Read API Ready",
    nextStep: "Back with approval request table after policy is frozen.",
  },
  {
    id: "approval-decision",
    consoleId: "sensitive-action-approval",
    method: "PATCH",
    endpoint: "/api/internal/approvals/sensitive-actions/:id",
    queryKey: "internal.approvals.sensitiveDecision",
    controller: "InternalApprovalController.decide",
    requestDto: "DecideSensitiveActionRequestDto",
    responseDto: "SensitiveActionDecisionDto",
    accessRule: "Two-person approval policy",
    auditRule: "Required audit event with reason and rollback note",
    readiness: "Write API Blocked",
    nextStep: "Enable only after RBAC, audit, rate-limit, and rollback validation exist.",
  },
];

export function getInternalAdminBackendEndpoints(consoleId: InternalAdminConsoleId) {
  return internalAdminBackendEndpoints.filter((item) => item.consoleId === consoleId);
}