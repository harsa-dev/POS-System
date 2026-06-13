import type {
  ServiceBusinessCostLine,
  ServiceBusinessInvoice,
  ServiceBusinessJob,
  ServiceBusinessPriority,
  ServiceBusinessQuote,
  ServiceBusinessWorkflowStatus,
} from "./service-business-workspace-types";

const statusLabels: Record<ServiceBusinessWorkflowStatus, string> = {
  REQUEST_INTAKE: "Request intake",
  JOB_PLANNING: "Job planning",
  QUOTATION_DRAFT: "Quotation draft",
  QUOTATION_APPROVED: "Quotation approved",
  IN_PROGRESS: "In progress",
  READY_FOR_REVIEW: "Ready for review",
  DELIVERED: "Delivered",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CLOSED: "Closed",
};

const priorityLabels: Record<ServiceBusinessPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export function formatServiceMoney(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getServiceStatusLabel(status: ServiceBusinessWorkflowStatus) {
  return statusLabels[status];
}

export function getServicePriorityLabel(priority: ServiceBusinessPriority) {
  return priorityLabels[priority];
}

export function getServiceStatusTone(status: ServiceBusinessWorkflowStatus) {
  if (["REQUEST_INTAKE", "JOB_PLANNING", "QUOTATION_DRAFT"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (["QUOTATION_APPROVED", "IN_PROGRESS", "READY_FOR_REVIEW"].includes(status)) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (["DELIVERED", "INVOICED", "PAID", "CLOSED"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

export function getServicePriorityTone(priority: ServiceBusinessPriority) {
  if (priority === "URGENT") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "HIGH") return "border-orange-200 bg-orange-50 text-orange-700";
  if (priority === "NORMAL") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

export function calculateCostBase(costLines: readonly ServiceBusinessCostLine[]) {
  return costLines.reduce(
    (total, line) => total + line.quantity * line.unitCost,
    0,
  );
}

export function calculateBillableCost(costLines: readonly ServiceBusinessCostLine[]) {
  return costLines.reduce((total, line) => {
    if (!line.billable) return total;
    return total + line.quantity * line.unitCost;
  }, 0);
}

export function calculateQuoteSubtotal(job: ServiceBusinessJob) {
  const billableCost = calculateBillableCost(job.costLines);
  const marginAmount = Math.round(
    billableCost * (job.quote.targetMarginRate / 100),
  );

  return billableCost + marginAmount;
}

export function calculateQuoteTax(job: ServiceBusinessJob) {
  const taxableAmount = Math.max(
    calculateQuoteSubtotal(job) - job.quote.discountAmount,
    0,
  );

  return Math.round(taxableAmount * (job.quote.taxRate / 100));
}

export function calculateQuoteTotal(job: ServiceBusinessJob) {
  const subtotal = calculateQuoteSubtotal(job);
  const taxableAmount = Math.max(subtotal - job.quote.discountAmount, 0);
  return taxableAmount + calculateQuoteTax(job);
}

export function calculateGrossProfit(job: ServiceBusinessJob) {
  return calculateQuoteTotal(job) - calculateCostBase(job.costLines);
}

export function calculateCollectionRate(invoice: ServiceBusinessInvoice, quoteTotal: number) {
  if (quoteTotal <= 0) return 0;
  return Math.min(Math.round((invoice.paidAmount / quoteTotal) * 100), 100);
}

export function getQuoteStatusLabel(status: ServiceBusinessQuote["status"]) {
  const labels: Record<ServiceBusinessQuote["status"], string> = {
    draft: "Draft",
    sent: "Sent",
    approved: "Approved",
    rejected: "Rejected",
    expired: "Expired",
  };

  return labels[status];
}

export function getInvoiceStatusLabel(status: ServiceBusinessInvoice["status"]) {
  const labels: Record<ServiceBusinessInvoice["status"], string> = {
    draft: "Draft",
    issued: "Issued",
    partial: "Partial",
    paid: "Paid",
    overdue: "Overdue",
  };

  return labels[status];
}
