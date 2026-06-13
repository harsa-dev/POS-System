export type ServiceBusinessWorkflowStatus =
  | "REQUEST_INTAKE"
  | "JOB_PLANNING"
  | "QUOTATION_DRAFT"
  | "QUOTATION_APPROVED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "DELIVERED"
  | "INVOICED"
  | "PAID"
  | "CLOSED";

export type ServiceBusinessPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type ServiceBusinessCostCategory =
  | "labor"
  | "material"
  | "operational"
  | "vendor";

export type ServiceBusinessMetric = {
  label: string;
  value: string;
  description: string;
  trendLabel?: string;
};

export type ServiceBusinessPipelineStage = {
  title: string;
  description: string;
  items: readonly string[];
};

export type ServiceBusinessCostLine = {
  id: string;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
};

export type ServiceBusinessQuote = {
  id: string;
  code: string;
  status: "draft" | "sent" | "approved" | "rejected" | "expired";
  validUntil: string;
  discountAmount: number;
  taxRate: number;
  targetMarginRate: number;
  customerApprovedAt?: string | null;
};

export type ServiceBusinessInvoice = {
  id: string;
  code: string;
  status: "draft" | "issued" | "partial" | "paid" | "overdue";
  dueDate: string;
  paidAmount: number;
};

export type ServiceBusinessTimelineItem = {
  label: string;
  at: string;
  actor: string;
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
  costLines: readonly ServiceBusinessCostLine[];
  checklist: readonly string[];
  quote: ServiceBusinessQuote;
  invoice: ServiceBusinessInvoice;
  timeline: readonly ServiceBusinessTimelineItem[];
};

export type ServiceBusinessConfigDraft = {
  defaultTaxRate: number;
  defaultMarginRate: number;
  defaultPaymentTermDays: number;
  serviceCategories: readonly string[];
  approvalRules: readonly string[];
};
