import type {
  ServiceBusinessWorkflowStatus,
  ServiceTransitionRequirement,
  ServiceWorkflowReadinessRow,
  ServiceWorkflowTargetRow,
} from "./service-business.types.js";

export const serviceBusinessAllowedTransitions: Record<
  ServiceBusinessWorkflowStatus,
  readonly ServiceBusinessWorkflowStatus[]
> = {
  REQUEST_INTAKE: ["JOB_PLANNING", "REJECTED", "CANCELLED"],
  JOB_PLANNING: ["QUOTATION_DRAFT", "CANCELLED"],
  QUOTATION_DRAFT: ["QUOTATION_APPROVED", "REJECTED", "CANCELLED"],
  QUOTATION_APPROVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["READY_FOR_REVIEW", "CANCELLED"],
  READY_FOR_REVIEW: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["INVOICED"],
  INVOICED: ["PAID"],
  PAID: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
  REJECTED: [],
};

function buildRequirement(
  id: string,
  label: string,
  isMet: boolean,
  missingReason: string,
): ServiceTransitionRequirement {
  return isMet ? { id, label, isMet } : { id, label, isMet, missingReason };
}

export function getServiceTransitionRequirements(
  nextStatus: ServiceBusinessWorkflowStatus,
  readiness: ServiceWorkflowReadinessRow,
): readonly ServiceTransitionRequirement[] {
  switch (nextStatus) {
    case "JOB_PLANNING":
      return [
        buildRequirement(
          "summary",
          "Request summary exists",
          readiness.hasSummary,
          "Add a short request summary before planning the job.",
        ),
      ];
    case "QUOTATION_DRAFT":
      return [
        buildRequirement(
          "cost-lines",
          "Job has at least one cost line",
          readiness.hasCostLines,
          "Add cost lines before drafting a quotation.",
        ),
        buildRequirement(
          "billable-cost",
          "Job has billable cost basis",
          readiness.hasBillableCost,
          "Add at least one billable cost line with a positive value.",
        ),
      ];
    case "QUOTATION_APPROVED":
      return [
        buildRequirement(
          "quotation",
          "Quotation draft exists",
          readiness.hasQuotation,
          "Create a quotation before marking it approved.",
        ),
      ];
    case "IN_PROGRESS":
      return [
        buildRequirement(
          "approved-quotation",
          "Approved quotation exists",
          readiness.hasApprovedQuotation,
          "Approve the quotation before starting work.",
        ),
      ];
    case "READY_FOR_REVIEW":
      return [
        buildRequirement(
          "checklist",
          "Execution checklist exists",
          readiness.checklistCount > 0,
          "Add checklist items before moving the job to review.",
        ),
      ];
    case "INVOICED":
      return [
        buildRequirement(
          "approved-quotation",
          "Approved quotation exists",
          readiness.hasApprovedQuotation,
          "Approved quote is required before issuing an invoice.",
        ),
      ];
    case "PAID":
      return [
        buildRequirement(
          "invoice",
          "Invoice exists",
          readiness.hasInvoice,
          "Create an invoice before recording paid status.",
        ),
      ];
    case "CLOSED":
      return [
        buildRequirement(
          "paid-invoice",
          "Invoice is fully paid",
          readiness.hasPaidInvoice,
          "Record full payment before closing the service job.",
        ),
      ];
    default:
      return [];
  }
}

export function buildServiceTransitionPreview(
  target: ServiceWorkflowTargetRow,
  nextStatus: ServiceBusinessWorkflowStatus,
  readiness: ServiceWorkflowReadinessRow,
) {
  const allowedNextStatuses = serviceBusinessAllowedTransitions[target.currentStatus] ?? [];
  const isAllowedTransition = allowedNextStatuses.includes(nextStatus);
  const requirements = getServiceTransitionRequirements(nextStatus, readiness);
  const unmetRequirements = requirements.filter((requirement) => !requirement.isMet);
  const canTransition = isAllowedTransition && unmetRequirements.length === 0;

  return {
    requestId: target.requestId,
    requestCode: target.requestCode,
    jobId: target.jobId,
    currentStatus: target.currentStatus,
    nextStatus,
    allowedNextStatuses,
    isAllowedTransition,
    canTransition,
    requirements,
    unmetRequirements,
  };
}
