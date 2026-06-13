import { errorCodes } from "../../lib/errors/error-codes.js";
import type {
  ServiceBusinessInvoiceStatus,
  ServiceBusinessJob,
  ServiceBusinessListQuery,
  ServiceBusinessMutationResult,
  ServiceBusinessWorkflowStatus,
} from "./service-business.types.js";
import {
  getDate,
  getFiniteNumber,
  getText,
  parseServiceBusinessCostCategory,
  parseServiceBusinessPriority,
  parseServiceBusinessWorkflowStatus,
} from "./service-business.validators.js";
import {
  approveServiceQuotationRecord,
  createServiceCostLineRecord,
  createServiceInvoiceRecord,
  createServiceQuotationRecord,
  createServiceRequestRecord,
  findServiceInvoiceTarget,
  findServiceJob,
  findServiceQuotationTarget,
  findServiceRequestTarget,
  getServiceRequestNextSequence,
  loadServiceJobs,
  recordServiceInvoicePaymentRecord,
} from "./service-business.crud.repository.js";
import { findServiceWorkflowTarget, updateServiceWorkflowStatus } from "./service-business.repository.js";

type ServiceBusinessError = {
  ok: false;
  status: number;
  code: string;
  message: string;
};

type ServiceBusinessOk<TData> = {
  ok: true;
  status?: number;
  data: TData;
};

export type ServiceBusinessResult<TData> = ServiceBusinessOk<TData> | ServiceBusinessError;

function validationError(message: string): ServiceBusinessError {
  return {
    ok: false,
    status: 400,
    code: errorCodes.validationError,
    message,
  };
}

function notFound(message: string): ServiceBusinessError {
  return {
    ok: false,
    status: 404,
    code: errorCodes.notFound,
    message,
  };
}

function ok<TData>(data: TData, status?: number): ServiceBusinessOk<TData> {
  return { ok: true, status, data };
}

export function calculateServiceCostTotal(costLines: readonly ServiceBusinessJob["costLines"][number][]) {
  return costLines.reduce((total, line) => total + line.quantity * line.unitCost, 0);
}

export function calculateServiceQuoteTotalFromCost({
  costTotal,
  discountAmount,
  taxRate,
  targetMarginRate,
}: {
  costTotal: number;
  discountAmount: number;
  taxRate: number;
  targetMarginRate: number;
}) {
  const marginBase = Math.round(costTotal / Math.max(1 - targetMarginRate, 0.01));
  const afterDiscount = Math.max(marginBase - discountAmount, 0);
  return Math.round(afterDiscount + afterDiscount * taxRate);
}

function calculateCollectionRate(job: ServiceBusinessJob) {
  const quoteTotal = calculateServiceQuoteTotalFromCost({
    costTotal: calculateServiceCostTotal(job.costLines),
    discountAmount: job.quote.discountAmount,
    taxRate: job.quote.taxRate,
    targetMarginRate: job.quote.targetMarginRate,
  });
  if (quoteTotal <= 0) return 0;
  return Math.min(job.invoice.paidAmount / quoteTotal, 1);
}

export function filterServiceJobs(jobs: readonly ServiceBusinessJob[], query: ServiceBusinessListQuery) {
  const search = getText(query.search).toLowerCase();
  const status = parseServiceBusinessWorkflowStatus(query.status);
  const priority = parseServiceBusinessPriority(query.priority);
  const assignedTo = getText(query.assignedTo).toLowerCase();
  const serviceCategory = getText(query.serviceCategory).toLowerCase();
  const dueDateFrom = getDate(query.dueDateFrom);
  const dueDateTo = getDate(query.dueDateTo);

  return jobs.filter((job) => {
    const dueDate = job.dueDate ? new Date(job.dueDate) : null;
    const matchesSearch =
      !search ||
      [job.requestCode, job.title, job.customerName, job.customerSegment, job.serviceCategory, job.assignedTo]
        .join(" ")
        .toLowerCase()
        .includes(search);

    const matchesStatus = !status || job.status === status;
    const matchesPriority = !priority || job.priority === priority;
    const matchesAssignee = !assignedTo || job.assignedTo.toLowerCase().includes(assignedTo);
    const matchesCategory = !serviceCategory || job.serviceCategory.toLowerCase().includes(serviceCategory);
    const matchesDueFrom = !dueDateFrom || (dueDate !== null && dueDate >= dueDateFrom);
    const matchesDueTo = !dueDateTo || (dueDate !== null && dueDate <= dueDateTo);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesCategory && matchesDueFrom && matchesDueTo;
  });
}

export async function getServiceBusinessWorkspace(businessId: string) {
  return loadServiceJobs(businessId);
}

export async function listServiceBusinessJobs(businessId: string, query: ServiceBusinessListQuery) {
  const jobs = await loadServiceJobs(businessId);
  return filterServiceJobs(jobs, query);
}

export async function createServiceBusinessRequest({
  businessId,
  actorName,
  body,
}: {
  businessId: string;
  actorName: string;
  body: Record<string, unknown>;
}): Promise<ServiceBusinessResult<ServiceBusinessMutationResult>> {
  const title = getText(body.title);
  const customerName = getText(body.customerName);
  const customerSegment = getText(body.customerSegment) || "General Service";
  const serviceCategory = getText(body.serviceCategory);
  const priority = parseServiceBusinessPriority(body.priority);
  const summary = getText(body.summary);
  const assignedTo = getText(body.assignedTo) || "Unassigned";
  const dueDate = getDate(body.dueDate);

  if (!title || !customerName || !serviceCategory || !priority) {
    return validationError("customerName, serviceCategory, title, and valid priority are required.");
  }

  const sequence = await getServiceRequestNextSequence(businessId);
  const requestCode = `SRV-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
  const created = await createServiceRequestRecord({
    businessId,
    requestCode,
    title,
    customerName,
    customerSegment,
    serviceCategory,
    priority,
    summary,
    assignedTo,
    dueDate,
    actorName,
  });
  const job = await findServiceJob(businessId, created.jobId);

  return ok(
    {
      success: true,
      dryRun: false,
      message: "Service request created.",
      job,
    },
    201,
  );
}

export async function updateServiceBusinessStatusDirect({
  businessId,
  actorName,
  id,
  body,
}: {
  businessId: string;
  actorName: string;
  id: string;
  body: Record<string, unknown>;
}): Promise<ServiceBusinessResult<ServiceBusinessMutationResult>> {
  const target = await findServiceWorkflowTarget(businessId, id);
  if (!target) return notFound("Service job not found.");

  const nextStatus = parseServiceBusinessWorkflowStatus(body.nextStatus ?? body.status);
  if (!nextStatus) {
    return validationError("nextStatus/status is required and must be a valid service status.");
  }

  await updateServiceWorkflowStatus({
    target,
    nextStatus,
    actorName,
    note: getText(body.note) || undefined,
  });

  const job = await findServiceJob(businessId, target.jobId ?? target.requestId);
  return ok({
    success: true,
    dryRun: false,
    message: `Status changed to ${nextStatus}.`,
    job,
  });
}

export async function addServiceBusinessCostLine({
  businessId,
  id,
  body,
}: {
  businessId: string;
  id: string;
  body: Record<string, unknown>;
}): Promise<ServiceBusinessResult<ServiceBusinessMutationResult>> {
  const target = await findServiceRequestTarget(businessId, id);
  if (!target?.jobId) return notFound("Service job not found.");

  const label = getText(body.label);
  const category = parseServiceBusinessCostCategory(body.category);
  const quantity = getFiniteNumber(body.quantity);
  const unitCost = getFiniteNumber(body.unitCost);
  const unitLabel = getText(body.unitLabel) || "unit";

  if (!label || !category || quantity === null || quantity <= 0 || unitCost === null || unitCost < 0) {
    return validationError("label, category, quantity, unitLabel, and unitCost are required.");
  }

  await createServiceCostLineRecord({
    target,
    label,
    category,
    quantity,
    unitLabel,
    unitCost,
    billable: Boolean(body.billable),
  });

  const job = await findServiceJob(businessId, target.jobId);
  return ok(
    {
      success: true,
      dryRun: false,
      message: "Service cost line created.",
      job,
    },
    201,
  );
}

export async function createServiceBusinessQuotation({
  businessId,
  actorName,
  body,
}: {
  businessId: string;
  actorName: string;
  body: Record<string, unknown>;
}): Promise<ServiceBusinessResult<ServiceBusinessMutationResult>> {
  const target = await findServiceRequestTarget(businessId, getText(body.requestId));
  if (!target) return notFound("Service request/job not found for quotation.");

  const job = await findServiceJob(businessId, target.jobId ?? target.requestId);
  const costTotal = calculateServiceCostTotal(job?.costLines ?? []);
  const discountAmount = Math.round(getFiniteNumber(body.discountAmount) ?? 0);
  const taxRate = getFiniteNumber(body.taxRate) ?? 0;
  const targetMarginRate = getFiniteNumber(body.targetMarginRate) ?? 0.3;
  const total = calculateServiceQuoteTotalFromCost({ costTotal, discountAmount, taxRate, targetMarginRate });
  const afterDiscount = Math.max(Math.round(costTotal / Math.max(1 - targetMarginRate, 0.01)) - discountAmount, 0);
  const taxAmount = Math.max(total - afterDiscount, 0);

  await createServiceQuotationRecord({
    target,
    costTotal,
    discountAmount,
    taxRate,
    targetMarginRate,
    total,
    taxAmount,
    validUntil: getDate(body.validUntil),
    actorName,
  });

  const updatedJob = await findServiceJob(businessId, target.jobId ?? target.requestId);
  return ok(
    {
      success: true,
      dryRun: false,
      message: "Service quotation created.",
      job: updatedJob,
    },
    201,
  );
}

export async function approveServiceBusinessQuotation({
  businessId,
  actorName,
  id,
}: {
  businessId: string;
  actorName: string;
  id: string;
}): Promise<ServiceBusinessResult<ServiceBusinessMutationResult>> {
  const target = await findServiceQuotationTarget(businessId, id);
  if (!target) return notFound("Service quotation not found.");

  await approveServiceQuotationRecord({ target, actorName });
  const job = await findServiceJob(businessId, target.jobId ?? target.requestId);

  return ok({
    success: true,
    dryRun: false,
    message: "Quotation approved.",
    job,
  });
}

export async function createServiceBusinessInvoice({
  businessId,
  actorName,
  body,
}: {
  businessId: string;
  actorName: string;
  body: Record<string, unknown>;
}): Promise<ServiceBusinessResult<ServiceBusinessMutationResult>> {
  const target = await findServiceRequestTarget(businessId, getText(body.requestId));
  if (!target) return notFound("Service request/job not found for invoice.");

  const job = await findServiceJob(businessId, target.jobId ?? target.requestId);
  const total = job
    ? calculateServiceQuoteTotalFromCost({
        costTotal: calculateServiceCostTotal(job.costLines),
        discountAmount: job.quote.discountAmount,
        taxRate: job.quote.taxRate,
        targetMarginRate: job.quote.targetMarginRate,
      })
    : 0;

  await createServiceInvoiceRecord({
    target,
    quotationId: getText(body.quotationId) || null,
    total,
    dueDate: getDate(body.dueDate),
    actorName,
  });

  const updatedJob = await findServiceJob(businessId, target.jobId ?? target.requestId);
  return ok(
    {
      success: true,
      dryRun: false,
      message: "Service invoice created.",
      job: updatedJob,
    },
    201,
  );
}

export async function recordServiceBusinessInvoicePayment({
  businessId,
  actorName,
  id,
  body,
}: {
  businessId: string;
  actorName: string;
  id: string;
  body: Record<string, unknown>;
}): Promise<ServiceBusinessResult<ServiceBusinessMutationResult>> {
  const paidAmount = getFiniteNumber(body.paidAmount);
  if (paidAmount === null || paidAmount <= 0) {
    return validationError("paidAmount must be greater than 0.");
  }

  const target = await findServiceInvoiceTarget(businessId, id);
  if (!target) return notFound("Service invoice not found.");

  const nextPaidAmount = Math.min(Math.round(Number(target.currentPaidAmount) + paidAmount), Number(target.invoiceTotal));
  const nextInvoiceStatus: ServiceBusinessInvoiceStatus = nextPaidAmount >= Number(target.invoiceTotal) ? "paid" : "partial";
  const nextWorkflowStatus: ServiceBusinessWorkflowStatus = nextInvoiceStatus === "paid" ? "PAID" : "INVOICED";

  await recordServiceInvoicePaymentRecord({
    target,
    paidAmount,
    nextPaidAmount,
    nextInvoiceStatus,
    nextWorkflowStatus,
    actorName,
  });

  const job = await findServiceJob(businessId, target.jobId ?? target.requestId);
  return ok({
    success: true,
    dryRun: false,
    message: "Service invoice payment recorded.",
    job,
    preview: {
      invoiceId: id,
      paidAmount: Math.round(paidAmount),
      paymentMethod: getText(body.paymentMethod) || "other",
      paidAt: getText(body.paidAt) || new Date().toISOString(),
      note: getText(body.note) || null,
      projectedCollectionRate: job ? calculateCollectionRate(job) : 0,
    },
  });
}
