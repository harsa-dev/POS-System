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

export type ServiceBusinessMutationPreviewResponse = {
  success: boolean;
  message: string;
  job?: ServiceBusinessJob;
};
