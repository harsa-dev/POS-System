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

export type CreateServiceInvoiceInput = {
  requestId: string;
  quotationId: string;
  dueDate: string;
  paymentTermDays: number;
};

export type RecordServiceInvoicePaymentInput = {
  invoiceId: string;
  paidAmount: number;
  paymentMethod: "cash" | "bank_transfer" | "card" | "qris" | "other";
  paidAt: string;
  note?: string;
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
