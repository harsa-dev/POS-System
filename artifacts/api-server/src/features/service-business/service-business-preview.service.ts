import {
  calculateServiceCostTotal,
  calculateServiceQuoteTotalFromCost,
} from "./service-business.crud.service.js";
import {
  findServiceInvoiceTarget,
  findServiceJob,
  findServiceRequestTarget,
} from "./service-business.crud.repository.js";
import { getDate, getFiniteNumber, getText } from "./service-business.validators.js";

export type ServiceBusinessPreviewKind = "quotation" | "invoice" | "invoice-payment";

export type ServiceBusinessPreviewResult<TEstimates extends Record<string, unknown>> = {
  kind: ServiceBusinessPreviewKind;
  canProceed: boolean;
  blockingIssues: string[];
  warnings: string[];
  estimates: TEstimates;
  previewedAt: string;
  source: "api-server-prisma-preview";
};

function normalizeMoney(value: unknown, fallback = 0) {
  const parsed = getFiniteNumber(value);
  return Math.max(Math.round(parsed ?? fallback), 0);
}

function normalizeRate(value: unknown, fallback = 0) {
  const parsed = getFiniteNumber(value);
  if (parsed === null) return fallback;
  return Math.max(Math.min(parsed, 1), 0);
}

function previewResult<TEstimates extends Record<string, unknown>>({
  kind,
  blockingIssues,
  warnings,
  estimates,
}: {
  kind: ServiceBusinessPreviewKind;
  blockingIssues: string[];
  warnings: string[];
  estimates: TEstimates;
}): ServiceBusinessPreviewResult<TEstimates> {
  return {
    kind,
    canProceed: blockingIssues.length === 0,
    blockingIssues,
    warnings,
    estimates,
    previewedAt: new Date().toISOString(),
    source: "api-server-prisma-preview",
  };
}

export async function previewServiceBusinessQuotation({
  businessId,
  body,
}: {
  businessId: string;
  body: Record<string, unknown>;
}) {
  const requestId = getText(body.requestId);
  const discountAmount = normalizeMoney(body.discountAmount);
  const taxRate = normalizeRate(body.taxRate);
  const targetMarginRate = normalizeRate(body.targetMarginRate, 0.3);
  const validUntil = getDate(body.validUntil);
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  if (!requestId) {
    blockingIssues.push("requestId is required to preview a quotation.");
  }

  const target = requestId ? await findServiceRequestTarget(businessId, requestId) : null;
  if (requestId && !target) {
    blockingIssues.push("Service request/job was not found for quotation preview.");
  }

  const job = target ? await findServiceJob(businessId, target.jobId ?? target.requestId) : null;
  const costLines = job?.costLines ?? [];
  const costTotal = calculateServiceCostTotal(costLines);
  const billableCostTotal = calculateServiceCostTotal(costLines.filter((line) => line.billable));
  const marginBase = Math.round(costTotal / Math.max(1 - targetMarginRate, 0.01));
  const subtotalAfterDiscount = Math.max(marginBase - discountAmount, 0);
  const total = calculateServiceQuoteTotalFromCost({
    costTotal,
    discountAmount,
    taxRate,
    targetMarginRate,
  });
  const taxAmount = Math.max(total - subtotalAfterDiscount, 0);

  if (job && costLines.length === 0) {
    warnings.push("This job has no cost lines yet; quotation total will be based on zero cost.");
  }

  if (job && billableCostTotal <= 0 && costLines.length > 0) {
    warnings.push("This job has no billable cost lines; review billable flags before sending a quotation.");
  }

  if (job?.quote.id) {
    warnings.push(`This request already has quotation ${job.quote.code || job.quote.id}; creating another quote may supersede the latest quote.`);
  }

  if (!validUntil) {
    warnings.push("validUntil is empty or invalid; created quotations can still be saved without an expiry date.");
  }

  return previewResult({
    kind: "quotation",
    blockingIssues,
    warnings,
    estimates: {
      requestId,
      requestCode: job?.requestCode ?? null,
      title: job?.title ?? null,
      customerName: job?.customerName ?? null,
      costLineCount: costLines.length,
      costTotal,
      billableCostTotal,
      discountAmount,
      taxRate,
      targetMarginRate,
      marginBase,
      subtotalAfterDiscount,
      taxAmount,
      total,
      validUntil: validUntil?.toISOString() ?? null,
      existingQuotationId: job?.quote.id || null,
      existingQuotationCode: job?.quote.code || null,
    },
  });
}

export async function previewServiceBusinessInvoice({
  businessId,
  body,
}: {
  businessId: string;
  body: Record<string, unknown>;
}) {
  const requestId = getText(body.requestId);
  const quotationId = getText(body.quotationId);
  const dueDate = getDate(body.dueDate);
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  if (!requestId) {
    blockingIssues.push("requestId is required to preview an invoice.");
  }

  const target = requestId ? await findServiceRequestTarget(businessId, requestId) : null;
  if (requestId && !target) {
    blockingIssues.push("Service request/job was not found for invoice preview.");
  }

  const job = target ? await findServiceJob(businessId, target.jobId ?? target.requestId) : null;
  const costTotal = calculateServiceCostTotal(job?.costLines ?? []);
  const invoiceTotal = job
    ? calculateServiceQuoteTotalFromCost({
        costTotal,
        discountAmount: job.quote.discountAmount,
        taxRate: job.quote.taxRate,
        targetMarginRate: job.quote.targetMarginRate,
      })
    : 0;

  if (job && !job.quote.id) {
    warnings.push("This job has no quotation yet; invoice total will be calculated from current cost and default quote settings.");
  }

  if (job?.quote.id && job.quote.status !== "approved") {
    warnings.push(`Latest quotation status is ${job.quote.status}; confirm approval before issuing the invoice.`);
  }

  if (job?.invoice.id) {
    warnings.push(`This request already has invoice ${job.invoice.code || job.invoice.id}; creating another invoice may supersede the latest invoice.`);
  }

  if (!dueDate) {
    warnings.push("dueDate is empty or invalid; created invoices can still be saved without a due date.");
  }

  return previewResult({
    kind: "invoice",
    blockingIssues,
    warnings,
    estimates: {
      requestId,
      requestCode: job?.requestCode ?? null,
      title: job?.title ?? null,
      customerName: job?.customerName ?? null,
      quotationId: quotationId || job?.quote.id || null,
      quotationCode: job?.quote.code || null,
      quoteStatus: job?.quote.status ?? null,
      costTotal,
      discountAmount: job?.quote.discountAmount ?? 0,
      taxRate: job?.quote.taxRate ?? 0,
      targetMarginRate: job?.quote.targetMarginRate ?? 0,
      invoiceTotal,
      dueDate: dueDate?.toISOString() ?? null,
      existingInvoiceId: job?.invoice.id || null,
      existingInvoiceCode: job?.invoice.code || null,
      existingInvoiceStatus: job?.invoice.status ?? null,
    },
  });
}

export async function previewServiceBusinessInvoicePayment({
  businessId,
  body,
}: {
  businessId: string;
  body: Record<string, unknown>;
}) {
  const invoiceId = getText(body.invoiceId);
  const paidAmount = normalizeMoney(body.paidAmount);
  const paymentMethod = getText(body.paymentMethod) || "other";
  const paidAt = getText(body.paidAt) || new Date().toISOString();
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  if (!invoiceId) {
    blockingIssues.push("invoiceId is required to preview an invoice payment.");
  }

  if (paidAmount <= 0) {
    blockingIssues.push("paidAmount must be greater than 0.");
  }

  const target = invoiceId ? await findServiceInvoiceTarget(businessId, invoiceId) : null;
  if (invoiceId && !target) {
    blockingIssues.push("Service invoice was not found for payment preview.");
  }

  const invoiceTotal = target?.invoiceTotal ?? 0;
  const currentPaidAmount = target?.currentPaidAmount ?? 0;
  const remainingBeforePayment = Math.max(invoiceTotal - currentPaidAmount, 0);
  const nextPaidAmount = target ? Math.min(currentPaidAmount + paidAmount, invoiceTotal) : paidAmount;
  const appliedAmount = Math.max(nextPaidAmount - currentPaidAmount, 0);
  const overflowAmount = Math.max(paidAmount - appliedAmount, 0);
  const remainingAfterPayment = Math.max(invoiceTotal - nextPaidAmount, 0);
  const nextInvoiceStatus = invoiceTotal > 0 && nextPaidAmount >= invoiceTotal ? "paid" : "partial";
  const nextWorkflowStatus = nextInvoiceStatus === "paid" ? "PAID" : "INVOICED";
  const projectedCollectionRate = invoiceTotal > 0 ? Math.min(nextPaidAmount / invoiceTotal, 1) : 0;

  if (overflowAmount > 0) {
    warnings.push("Payment amount exceeds remaining invoice balance; backend write will cap the applied amount to invoice total.");
  }

  if (target && remainingBeforePayment <= 0) {
    warnings.push("This invoice is already fully paid according to current data.");
  }

  return previewResult({
    kind: "invoice-payment",
    blockingIssues,
    warnings,
    estimates: {
      invoiceId,
      invoiceTotal,
      currentPaidAmount,
      remainingBeforePayment,
      requestedPaidAmount: paidAmount,
      appliedAmount,
      overflowAmount,
      nextPaidAmount,
      remainingAfterPayment,
      nextInvoiceStatus,
      nextWorkflowStatus,
      projectedCollectionRate,
      paymentMethod,
      paidAt,
      requestId: target?.requestId ?? null,
      jobId: target?.jobId ?? null,
    },
  });
}
