import type {
  ServiceBusinessCostCategory,
  ServiceBusinessJob,
  ServiceBusinessPriority,
  ServiceBusinessWorkflowStatus,
} from "./service-business-workspace-types";

export type ServiceBusinessWorkspaceResponse = {
  jobs: readonly ServiceBusinessJob[];
  generatedAt: string;
  mode: "custom-business-service";
};

export type ServiceBusinessSummaryResponse = {
  generatedAt: string;
  source: "api-server-prisma-sql-summary";
  totals: {
    jobs: number;
    activeJobs: number;
    highPriorityJobs: number;
    approvedQuotes: number;
    issuedInvoices: number;
  };
  money: {
    quoteTotal: number;
    invoiceTotal: number;
    pendingCollection: number;
    paidAmount: number;
  };
  collection: {
    averageRate: number;
    overallRate: number;
  };
  workflowDistribution: Record<ServiceBusinessWorkflowStatus, number>;
  invoiceDistribution: Record<string, number>;
  latestJob: {
    id: string;
    requestCode: string;
    title: string;
    customerName: string;
    status: ServiceBusinessWorkflowStatus;
    statusLabel: string;
  } | null;
};

export type ListServiceBusinessJobsQuery = {
  search?: string;
  status?: ServiceBusinessWorkflowStatus | "all";
  priority?: ServiceBusinessPriority | "all";
  assignedTo?: string;
  serviceCategory?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
};

export type CreateServiceRequestInput = {
  customerName: string;
  customerSegment?: string;
  serviceCategory: string;
  title: string;
  summary?: string;
  priority: ServiceBusinessPriority;
  dueDate?: string;
};

export type UpdateServiceJobStatusInput = {
  jobId: string;
  nextStatus: ServiceBusinessWorkflowStatus;
  note?: string;
};

export type UpdateServiceRequestStatusInput = {
  requestId: string;
  nextStatus: ServiceBusinessWorkflowStatus;
  note?: string;
};

export type AddServiceCostLineInput = {
  jobId: string;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
};

export type CreateServiceQuotationInput = {
  requestId: string;
  discountAmount: number;
  taxRate: number;
  targetMarginRate: number;
  validUntil: string;
};

export type ApproveServiceQuotationInput = {
  quotationId: string;
  approvedBy: string;
  approvedAt: string;
  note?: string;
};

export type CancelServiceQuotationInput = {
  quotationId: string;
  note?: string;
};

export type CreateServiceInvoiceInput = {
  requestId: string;
  quotationId: string;
  dueDate: string;
  paymentTermDays: number;
};

export type CancelServiceInvoiceInput = {
  invoiceId: string;
  note?: string;
};

export type RecordServiceInvoicePaymentInput = {
  invoiceId: string;
  paidAmount: number;
  paymentMethod: "cash" | "bank_transfer" | "card" | "qris" | "other";
  paidAt: string;
  note?: string;
};

export type ReverseServiceInvoicePaymentInput = {
  invoiceId: string;
  amount?: number;
  note?: string;
};

export type ServiceBusinessPreviewKind = "quotation" | "invoice" | "invoice-payment";

export type ServiceBusinessPreviewResponse<TEstimates extends Record<string, unknown> = Record<string, unknown>> = {
  kind: ServiceBusinessPreviewKind;
  canProceed: boolean;
  blockingIssues: readonly string[];
  warnings: readonly string[];
  estimates: TEstimates;
  previewedAt: string;
  source: "api-server-prisma-preview";
};

export type ServiceBusinessQuotationPreviewEstimates = {
  requestId: string;
  requestCode: string | null;
  title: string | null;
  customerName: string | null;
  costLineCount: number;
  costTotal: number;
  billableCostTotal: number;
  discountAmount: number;
  taxRate: number;
  targetMarginRate: number;
  marginBase: number;
  subtotalAfterDiscount: number;
  taxAmount: number;
  total: number;
  validUntil: string | null;
  existingQuotationId: string | null;
  existingQuotationCode: string | null;
};

export type ServiceBusinessInvoicePreviewEstimates = {
  requestId: string;
  requestCode: string | null;
  title: string | null;
  customerName: string | null;
  quotationId: string | null;
  quotationCode: string | null;
  quoteStatus: string | null;
  costTotal: number;
  discountAmount: number;
  taxRate: number;
  targetMarginRate: number;
  invoiceTotal: number;
  dueDate: string | null;
  existingInvoiceId: string | null;
  existingInvoiceCode: string | null;
  existingInvoiceStatus: string | null;
};

export type ServiceBusinessInvoicePaymentPreviewEstimates = {
  invoiceId: string;
  invoiceTotal: number;
  currentPaidAmount: number;
  remainingBeforePayment: number;
  requestedPaidAmount: number;
  appliedAmount: number;
  overflowAmount: number;
  nextPaidAmount: number;
  remainingAfterPayment: number;
  nextInvoiceStatus: string;
  nextWorkflowStatus: ServiceBusinessWorkflowStatus;
  projectedCollectionRate: number;
  paymentMethod: string;
  paidAt: string;
  requestId: string | null;
  jobId: string | null;
};

export type ServiceBusinessTransitionRequirement = {
  id: string;
  label: string;
  isMet: boolean;
  missingReason?: string;
};

export type ServiceBusinessTransitionPreviewResponse = {
  requestId: string;
  requestCode: string;
  jobId: string | null;
  currentStatus: ServiceBusinessWorkflowStatus;
  nextStatus: ServiceBusinessWorkflowStatus;
  allowedNextStatuses: readonly ServiceBusinessWorkflowStatus[];
  isAllowedTransition: boolean;
  canTransition: boolean;
  requirements: readonly ServiceBusinessTransitionRequirement[];
  unmetRequirements: readonly ServiceBusinessTransitionRequirement[];
};

export type ServiceBusinessWorkflowResponse = {
  statuses: readonly ServiceBusinessWorkflowStatus[];
  transitions: Record<ServiceBusinessWorkflowStatus, readonly ServiceBusinessWorkflowStatus[]>;
  source: "api-server-prisma-sql-workflow-guard";
};

export type ServiceBusinessMutationPreviewResponse = {
  success: boolean;
  message: string;
  job?: ServiceBusinessJob;
  transition?: ServiceBusinessTransitionPreviewResponse;
};
