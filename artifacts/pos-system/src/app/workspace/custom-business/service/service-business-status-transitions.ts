import { getServiceStatusLabel } from "./service-business-workspace-domain";
import type { ServiceBusinessWorkflowStatus } from "./service-business-workspace-types";

export type ServiceBusinessTransitionAction = {
  id: string;
  label: string;
  nextStatus: ServiceBusinessWorkflowStatus;
  requiredPermission: string;
  disabledReason: string;
};

export const serviceBusinessStatusTransitions: Record<
  ServiceBusinessWorkflowStatus,
  readonly ServiceBusinessWorkflowStatus[]
> = {
  REQUEST_INTAKE: ["JOB_PLANNING"],
  JOB_PLANNING: ["QUOTATION_DRAFT"],
  QUOTATION_DRAFT: ["QUOTATION_APPROVED"],
  QUOTATION_APPROVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["READY_FOR_REVIEW"],
  READY_FOR_REVIEW: ["DELIVERED"],
  DELIVERED: ["INVOICED"],
  INVOICED: ["PAID"],
  PAID: ["CLOSED"],
  CLOSED: [],
};

const permissionByNextStatus: Record<ServiceBusinessWorkflowStatus, string> = {
  REQUEST_INTAKE: "custom-business.service.request.create",
  JOB_PLANNING: "custom-business.service.job.assign",
  QUOTATION_DRAFT: "custom-business.service.quote.create",
  QUOTATION_APPROVED: "custom-business.service.quote.approve",
  IN_PROGRESS: "custom-business.service.job.status.update",
  READY_FOR_REVIEW: "custom-business.service.job.status.update",
  DELIVERED: "custom-business.service.job.status.update",
  INVOICED: "custom-business.service.invoice.create",
  PAID: "custom-business.service.invoice.payment.record",
  CLOSED: "custom-business.service.manage",
};

const actionLabelByNextStatus: Record<ServiceBusinessWorkflowStatus, string> = {
  REQUEST_INTAKE: "Create request",
  JOB_PLANNING: "Start planning",
  QUOTATION_DRAFT: "Draft quotation",
  QUOTATION_APPROVED: "Approve quotation",
  IN_PROGRESS: "Start service work",
  READY_FOR_REVIEW: "Mark ready for review",
  DELIVERED: "Confirm delivery",
  INVOICED: "Issue invoice",
  PAID: "Record payment",
  CLOSED: "Close service job",
};

export function getNextServiceStatuses(status: ServiceBusinessWorkflowStatus) {
  return serviceBusinessStatusTransitions[status];
}

export function getServiceTransitionActions(
  status: ServiceBusinessWorkflowStatus,
): readonly ServiceBusinessTransitionAction[] {
  return getNextServiceStatuses(status).map((nextStatus) => ({
    id: `${status}-${nextStatus}`,
    label: actionLabelByNextStatus[nextStatus],
    nextStatus,
    requiredPermission: permissionByNextStatus[nextStatus],
    disabledReason:
      "Disabled until service backend, authorization, and transition validation exist.",
  }));
}

export function getServiceTransitionSummary(status: ServiceBusinessWorkflowStatus) {
  const nextStatuses = getNextServiceStatuses(status);

  if (nextStatuses.length === 0) {
    return "This status is terminal in the current mock workflow.";
  }

  return `Next: ${nextStatuses.map(getServiceStatusLabel).join(", ")}`;
}
