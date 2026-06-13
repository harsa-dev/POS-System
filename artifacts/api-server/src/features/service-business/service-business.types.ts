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

export const serviceBusinessPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const serviceBusinessCostCategories = ["labor", "material", "operational", "vendor"] as const;
export const serviceBusinessQuoteStatuses = ["draft", "sent", "approved", "rejected", "expired"] as const;
export const serviceBusinessInvoiceStatuses = ["draft", "issued", "partial", "paid", "overdue", "cancelled"] as const;

export type ServiceBusinessWorkflowStatus = (typeof serviceBusinessWorkflowStatuses)[number];
export type ServiceBusinessPriority = (typeof serviceBusinessPriorities)[number];
export type ServiceBusinessCostCategory = (typeof serviceBusinessCostCategories)[number];
export type ServiceBusinessQuoteStatus = (typeof serviceBusinessQuoteStatuses)[number];
export type ServiceBusinessInvoiceStatus = (typeof serviceBusinessInvoiceStatuses)[number];

export type ServiceBusinessCostLine = {
  id: string;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
};

export type ServiceBusinessJob = {
  id: string;
  requestCode: string;
  title: string;
  customerName: string;
  customerSegment: string;
  serviceCategory: string;
  status: ServiceBusinessWorkflowStatus;
  priority: ServiceBusinessPriority;
  assignedTo: string;
  dueDate: string;
  summary: string;
  costLines: ServiceBusinessCostLine[];
  checklist: string[];
  quote: {
    id: string;
    code: string;
    status: ServiceBusinessQuoteStatus;
    validUntil: string;
    discountAmount: number;
    taxRate: number;
    targetMarginRate: number;
    customerApprovedAt?: string | null;
  };
  invoice: {
    id: string;
    code: string;
    status: ServiceBusinessInvoiceStatus;
    dueDate: string;
    paidAmount: number;
  };
  timeline: Array<{
    label: string;
    at: string;
    actor: string;
  }>;
};

export type ServiceBusinessListQuery = {
  search?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedTo?: unknown;
  serviceCategory?: unknown;
  dueDateFrom?: unknown;
  dueDateTo?: unknown;
};

export type ServiceBusinessMutationResult = {
  success: true;
  dryRun: false;
  message: string;
  job: ServiceBusinessJob | null;
  preview?: Record<string, unknown>;
};

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
