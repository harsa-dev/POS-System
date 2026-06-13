export const serviceBusinessWorkflowStatuses = [
  "REQUEST_INTAKE",
  "JOB_PLANNING",
  "QUOTATION_DRAFT",
  "QUOTATION_APPROVED",
  "IN_PROGRESS",
  "READY_FOR_REVIEW",
  "DELIVERED",
  "INVOICED",
  "PAID",
  "CLOSED",
  "CANCELLED",
  "REJECTED",
] as const;

export type ServiceBusinessWorkflowStatus = (typeof serviceBusinessWorkflowStatuses)[number];

export type ServiceTransitionRequirement = {
  id: string;
  label: string;
  isMet: boolean;
  missingReason?: string;
};

export type ServiceWorkflowTargetRow = {
  requestId: string;
  requestCode: string;
  jobId: string | null;
  currentStatus: ServiceBusinessWorkflowStatus;
  summary: string | null;
};

export type ServiceWorkflowReadinessRow = {
  hasSummary: boolean;
  hasCostLines: boolean;
  hasBillableCost: boolean;
  hasQuotation: boolean;
  hasApprovedQuotation: boolean;
  hasInvoice: boolean;
  hasPaidInvoice: boolean;
  checklistCount: number;
};

export type ServiceTransitionPreview = {
  requestId: string;
  requestCode: string;
  jobId: string | null;
  currentStatus: ServiceBusinessWorkflowStatus;
  nextStatus: ServiceBusinessWorkflowStatus;
  allowedNextStatuses: readonly ServiceBusinessWorkflowStatus[];
  isAllowedTransition: boolean;
  canTransition: boolean;
  requirements: readonly ServiceTransitionRequirement[];
  unmetRequirements: readonly ServiceTransitionRequirement[];
};
