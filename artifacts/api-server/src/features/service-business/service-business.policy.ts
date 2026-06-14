import {
  SERVICE_BUSINESS_AUDIT_ACTION,
  SERVICE_BUSINESS_AUDIT_ENTITY,
  SERVICE_BUSINESS_AUDIT_OPERATION,
  type ServiceBusinessAuditAction,
  type ServiceBusinessAuditEntity,
  type ServiceBusinessAuditOperation,
} from "./service-business.audit.js";
import {
  SERVICE_BUSINESS_PERMISSIONS,
  getServiceBusinessPermissionRoles,
  type ServiceBusinessPermission,
} from "./service-business.permissions.js";

type ServiceBusinessPolicyMethod = "GET" | "POST" | "PATCH" | "DELETE";

type ServiceBusinessPolicyAuditRequirement =
  | {
      required: false;
      reason: string;
    }
  | {
      required: true;
      action: ServiceBusinessAuditAction;
      entityType: ServiceBusinessAuditEntity;
      operation: ServiceBusinessAuditOperation;
    };

export type ServiceBusinessPolicyEntry = {
  id: string;
  method: ServiceBusinessPolicyMethod;
  path: string;
  permission: ServiceBusinessPermission;
  audit: ServiceBusinessPolicyAuditRequirement;
  note: string;
};

const noAudit = (reason: string): ServiceBusinessPolicyAuditRequirement => ({
  required: false,
  reason,
});

const updateAudit = (
  entityType: ServiceBusinessAuditEntity,
  operation: ServiceBusinessAuditOperation,
): ServiceBusinessPolicyAuditRequirement => ({
  required: true,
  action: SERVICE_BUSINESS_AUDIT_ACTION.update,
  entityType,
  operation,
});

const createAudit = (
  entityType: ServiceBusinessAuditEntity,
  operation: ServiceBusinessAuditOperation,
): ServiceBusinessPolicyAuditRequirement => ({
  required: true,
  action: SERVICE_BUSINESS_AUDIT_ACTION.create,
  entityType,
  operation,
});

export const SERVICE_BUSINESS_POLICY_MATRIX = [
  {
    id: "workspace.read",
    method: "GET",
    path: "/custom-business/service/workspace",
    permission: SERVICE_BUSINESS_PERMISSIONS.view,
    audit: noAudit("Read-only workspace projection."),
    note: "Loads Service Business workspace cards and job summaries.",
  },
  {
    id: "jobs.list",
    method: "GET",
    path: "/custom-business/service/jobs",
    permission: SERVICE_BUSINESS_PERMISSIONS.view,
    audit: noAudit("Read-only job list."),
    note: "Lists service jobs with query filters.",
  },
  {
    id: "summary.read",
    method: "GET",
    path: "/custom-business/service/summary",
    permission: SERVICE_BUSINESS_PERMISSIONS.view,
    audit: noAudit("Read-only dashboard summary."),
    note: "Feeds the shared Service Business dashboard bridge.",
  },
  {
    id: "workflow.statuses.read",
    method: "GET",
    path: "/custom-business/service/workflow/statuses",
    permission: SERVICE_BUSINESS_PERMISSIONS.view,
    audit: noAudit("Read-only workflow metadata."),
    note: "Returns valid Service Business workflow statuses.",
  },
  {
    id: "workflow.transition-preview.read",
    method: "GET",
    path: "/custom-business/service/jobs/:id/transition-preview",
    permission: SERVICE_BUSINESS_PERMISSIONS.view,
    audit: noAudit("Read-only transition preview."),
    note: "Previews workflow status transition requirements.",
  },
  {
    id: "preview.quotation",
    method: "POST",
    path: "/custom-business/service/previews/quotation",
    permission: SERVICE_BUSINESS_PERMISSIONS.quoteCreate,
    audit: noAudit("Read-only quotation preview. POST is used only to carry a payload."),
    note: "Previews quote pricing without creating a quotation.",
  },
  {
    id: "preview.invoice",
    method: "POST",
    path: "/custom-business/service/previews/invoice",
    permission: SERVICE_BUSINESS_PERMISSIONS.invoiceCreate,
    audit: noAudit("Read-only invoice preview. POST is used only to carry a payload."),
    note: "Previews invoice totals without creating an invoice.",
  },
  {
    id: "preview.invoice-payment",
    method: "POST",
    path: "/custom-business/service/previews/invoice-payment",
    permission: SERVICE_BUSINESS_PERMISSIONS.invoicePaymentRecord,
    audit: noAudit("Read-only payment preview. POST is used only to carry a payload."),
    note: "Previews invoice payment impact without recording payment.",
  },
  {
    id: "requests.create",
    method: "POST",
    path: "/custom-business/service/requests",
    permission: SERVICE_BUSINESS_PERMISSIONS.requestCreate,
    audit: createAudit(SERVICE_BUSINESS_AUDIT_ENTITY.job, SERVICE_BUSINESS_AUDIT_OPERATION.createRequest),
    note: "Creates service request/job intake data and writes ServiceJob audit.",
  },
  {
    id: "jobs.status.direct",
    method: "PATCH",
    path: "/custom-business/service/jobs/:id/status",
    permission: SERVICE_BUSINESS_PERMISSIONS.jobStatusUpdate,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.job, SERVICE_BUSINESS_AUDIT_OPERATION.updateStatus),
    note: "Legacy direct status mutation retained for compatibility.",
  },
  {
    id: "jobs.status.guarded-legacy",
    method: "PATCH",
    path: "/custom-business/service/jobs/:id/guarded-status",
    permission: SERVICE_BUSINESS_PERMISSIONS.jobStatusUpdate,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.workflowStatus, SERVICE_BUSINESS_AUDIT_OPERATION.updateStatus),
    note: "Legacy guarded status mutation retained for compatibility.",
  },
  {
    id: "jobs.status.facade",
    method: "POST",
    path: "/custom-business/service/status/jobs/:id",
    permission: SERVICE_BUSINESS_PERMISSIONS.jobStatusUpdate,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.workflowStatus, SERVICE_BUSINESS_AUDIT_OPERATION.updateStatus),
    note: "Explicit Service status facade used by frontend actions.",
  },
  {
    id: "requests.status.facade",
    method: "POST",
    path: "/custom-business/service/status/requests/:id",
    permission: SERVICE_BUSINESS_PERMISSIONS.jobStatusUpdate,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.workflowStatus, SERVICE_BUSINESS_AUDIT_OPERATION.updateStatus),
    note: "Explicit Service request status facade.",
  },
  {
    id: "cost-lines.create",
    method: "POST",
    path: "/custom-business/service/jobs/:id/cost-lines",
    permission: SERVICE_BUSINESS_PERMISSIONS.costCreate,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.job, SERVICE_BUSINESS_AUDIT_OPERATION.addCostLine),
    note: "Adds cost lines and audits the affected ServiceJob aggregate.",
  },
  {
    id: "quotations.create",
    method: "POST",
    path: "/custom-business/service/quotations",
    permission: SERVICE_BUSINESS_PERMISSIONS.quoteCreate,
    audit: createAudit(SERVICE_BUSINESS_AUDIT_ENTITY.quotation, SERVICE_BUSINESS_AUDIT_OPERATION.createQuotation),
    note: "Creates quotation and writes ServiceQuotation audit.",
  },
  {
    id: "quotations.approve",
    method: "PATCH",
    path: "/custom-business/service/quotations/:id/approve",
    permission: SERVICE_BUSINESS_PERMISSIONS.quoteApprove,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.quotation, SERVICE_BUSINESS_AUDIT_OPERATION.approveQuotation),
    note: "Approves quotation and writes ServiceQuotation audit.",
  },
  {
    id: "invoices.create",
    method: "POST",
    path: "/custom-business/service/invoices",
    permission: SERVICE_BUSINESS_PERMISSIONS.invoiceCreate,
    audit: createAudit(SERVICE_BUSINESS_AUDIT_ENTITY.invoice, SERVICE_BUSINESS_AUDIT_OPERATION.createInvoice),
    note: "Creates invoice and writes ServiceInvoice audit.",
  },
  {
    id: "invoices.payment.record",
    method: "PATCH",
    path: "/custom-business/service/invoices/:id/payment",
    permission: SERVICE_BUSINESS_PERMISSIONS.invoicePaymentRecord,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.invoice, SERVICE_BUSINESS_AUDIT_OPERATION.recordInvoicePayment),
    note: "Records payment and writes ServiceInvoice audit.",
  },
  {
    id: "quotations.cancel",
    method: "POST",
    path: "/custom-business/service/reversals/quotations/:id/cancel",
    permission: SERVICE_BUSINESS_PERMISSIONS.quoteApprove,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.quotation, SERVICE_BUSINESS_AUDIT_OPERATION.cancelQuotation),
    note: "Cancels quotation and records reversal audit.",
  },
  {
    id: "invoices.cancel",
    method: "POST",
    path: "/custom-business/service/reversals/invoices/:id/cancel",
    permission: SERVICE_BUSINESS_PERMISSIONS.invoiceCreate,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.invoice, SERVICE_BUSINESS_AUDIT_OPERATION.cancelInvoice),
    note: "Cancels unpaid invoice and records reversal audit.",
  },
  {
    id: "invoices.payment.reverse",
    method: "POST",
    path: "/custom-business/service/reversals/invoices/:id/reverse-payment",
    permission: SERVICE_BUSINESS_PERMISSIONS.invoicePaymentRecord,
    audit: updateAudit(SERVICE_BUSINESS_AUDIT_ENTITY.invoice, SERVICE_BUSINESS_AUDIT_OPERATION.reverseInvoicePayment),
    note: "Reverses invoice payment and writes ServiceInvoice audit.",
  },
] as const satisfies readonly ServiceBusinessPolicyEntry[];

export const SERVICE_BUSINESS_SENSITIVE_POLICY_ENTRY_IDS = SERVICE_BUSINESS_POLICY_MATRIX
  .filter((entry) => entry.audit.required)
  .map((entry) => entry.id);

export function getServiceBusinessPolicySnapshot() {
  return [...SERVICE_BUSINESS_POLICY_MATRIX];
}

export function getServiceBusinessPolicyEntriesByPermission(permission: ServiceBusinessPermission) {
  return SERVICE_BUSINESS_POLICY_MATRIX.filter((entry) => entry.permission === permission);
}

export function assertServiceBusinessPolicyCoverage() {
  const permissions = Object.values(SERVICE_BUSINESS_PERMISSIONS) as ServiceBusinessPermission[];
  const missingPermissions = permissions.filter(
    (permission) => getServiceBusinessPolicyEntriesByPermission(permission).length === 0,
  );

  if (missingPermissions.length > 0) {
    throw new Error(`Missing Service Business policy coverage for permissions: ${missingPermissions.join(", ")}`);
  }

  const permissionsWithoutRoles = permissions.filter(
    (permission) => getServiceBusinessPermissionRoles(permission).length === 0,
  );

  if (permissionsWithoutRoles.length > 0) {
    throw new Error(`Missing Service Business role mapping for permissions: ${permissionsWithoutRoles.join(", ")}`);
  }

  const sensitiveWithoutAudit = SERVICE_BUSINESS_POLICY_MATRIX.filter(
    (entry) => entry.method !== "GET" && !entry.id.startsWith("preview.") && !entry.audit.required,
  );

  if (sensitiveWithoutAudit.length > 0) {
    throw new Error(
      `Sensitive Service Business policy entries must require audit: ${sensitiveWithoutAudit
        .map((entry) => entry.id)
        .join(", ")}`,
    );
  }

  return {
    entryCount: SERVICE_BUSINESS_POLICY_MATRIX.length,
    sensitiveEntryCount: SERVICE_BUSINESS_SENSITIVE_POLICY_ENTRY_IDS.length,
    readOnlyOrPreviewEntryCount: SERVICE_BUSINESS_POLICY_MATRIX.length - SERVICE_BUSINESS_SENSITIVE_POLICY_ENTRY_IDS.length,
  };
}
