import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const statusOrder = [
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

const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
const costCategories = ["labor", "material", "operational", "vendor"] as const;

type ServiceBusinessWorkflowStatus = (typeof statusOrder)[number];
type ServiceBusinessPriority = (typeof priorities)[number];
type ServiceBusinessCostCategory = (typeof costCategories)[number];
type ServiceBusinessQuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
type ServiceBusinessInvoiceStatus = "draft" | "issued" | "partial" | "paid" | "overdue" | "cancelled";

type ServiceBusinessCostLine = {
  id: string;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
};

type ServiceBusinessJob = {
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

type ServiceRequestRow = {
  requestId: string;
  requestCode: string;
  title: string;
  customerName: string;
  customerSegment: string | null;
  serviceCategory: string;
  requestStatus: ServiceBusinessWorkflowStatus;
  priority: ServiceBusinessPriority;
  assignedTo: string | null;
  dueDate: Date | null;
  summary: string | null;
  jobId: string | null;
  jobTitle: string | null;
  jobStatus: ServiceBusinessWorkflowStatus | null;
};

type ServiceCostLineRow = {
  id: string;
  jobId: string;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
};

type ServiceQuotationRow = {
  id: string;
  requestId: string;
  jobId: string | null;
  quotationCode: string;
  status: ServiceBusinessQuoteStatus;
  discountAmount: number;
  taxRate: number;
  marginRate: number;
  total: number;
  validUntil: Date | null;
  approvedAt: Date | null;
};

type ServiceInvoiceRow = {
  id: string;
  requestId: string;
  quotationId: string | null;
  invoiceCode: string;
  status: ServiceBusinessInvoiceStatus;
  total: number;
  paidAmount: number;
  dueDate: Date | null;
  paidAt: Date | null;
};

type ServiceChecklistRow = {
  id: string;
  jobId: string;
  label: string;
  isDone: boolean;
};

type ServiceTimelineRow = {
  id: string;
  requestId: string;
  label: string;
  actorName: string;
  occurredAt: Date;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getDate(value: unknown) {
  const raw = getText(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function isStatus(value: string): value is ServiceBusinessWorkflowStatus {
  return statusOrder.includes(value as ServiceBusinessWorkflowStatus);
}

function isPriority(value: string): value is ServiceBusinessPriority {
  return priorities.includes(value as ServiceBusinessPriority);
}

function isCostCategory(value: string): value is ServiceBusinessCostCategory {
  return costCategories.includes(value as ServiceBusinessCostCategory);
}

function requireBodyObject(reqBody: unknown) {
  return typeof reqBody === "object" && reqBody !== null ? (reqBody as Record<string, unknown>) : null;
}

function calculateCostTotal(costLines: readonly ServiceBusinessCostLine[]) {
  return costLines.reduce((total, line) => total + line.quantity * line.unitCost, 0);
}

function calculateQuoteTotalFromCost({
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
  const quoteTotal = calculateQuoteTotalFromCost({
    costTotal: calculateCostTotal(job.costLines),
    discountAmount: job.quote.discountAmount,
    taxRate: job.quote.taxRate,
    targetMarginRate: job.quote.targetMarginRate,
  });
  if (quoteTotal <= 0) return 0;
  return Math.min(job.invoice.paidAmount / quoteTotal, 1);
}

function filterJobs(jobs: readonly ServiceBusinessJob[], query: Record<string, unknown>) {
  const search = getText(query.search).toLowerCase();
  const rawStatus = getText(query.status).toUpperCase();
  const rawPriority = getText(query.priority).toUpperCase();
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

    const matchesStatus = !rawStatus || rawStatus === "ALL" || job.status === rawStatus;
    const matchesPriority = !rawPriority || rawPriority === "ALL" || job.priority === rawPriority;
    const matchesAssignee = !assignedTo || job.assignedTo.toLowerCase().includes(assignedTo);
    const matchesCategory = !serviceCategory || job.serviceCategory.toLowerCase().includes(serviceCategory);
    const matchesDueFrom = !dueDateFrom || (dueDate !== null && dueDate >= dueDateFrom);
    const matchesDueTo = !dueDateTo || (dueDate !== null && dueDate <= dueDateTo);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesCategory && matchesDueFrom && matchesDueTo;
  });
}

function groupBy<TItem, TKey extends string>(items: readonly TItem[], getKey: (item: TItem) => TKey) {
  return items.reduce<Record<TKey, TItem[]>>((result, item) => {
    const key = getKey(item);
    result[key] ??= [];
    result[key].push(item);
    return result;
  }, {} as Record<TKey, TItem[]>);
}

async function getNextSequence(businessId: string) {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM service_requests
    WHERE business_id = ${businessId}
  `);

  return Number(rows[0]?.count ?? 0) + 1;
}

async function loadServiceJobs(businessId: string) {
  const requestRows = await prisma.$queryRaw<ServiceRequestRow[]>(Prisma.sql`
    SELECT
      r.id AS "requestId",
      r.request_code AS "requestCode",
      r.title,
      r.customer_name AS "customerName",
      r.customer_segment AS "customerSegment",
      r.service_category AS "serviceCategory",
      r.status AS "requestStatus",
      r.priority,
      r.assigned_to AS "assignedTo",
      r.due_date AS "dueDate",
      r.summary,
      j.id AS "jobId",
      j.title AS "jobTitle",
      j.status AS "jobStatus"
    FROM service_requests r
    LEFT JOIN service_jobs j ON j.request_id = r.id
    WHERE r.business_id = ${businessId}
    ORDER BY r.created_at DESC
  `);

  const requestIds = requestRows.map((row) => row.requestId);
  const jobIds = requestRows.map((row) => row.jobId).filter((value): value is string => Boolean(value));

  if (!requestIds.length) return [];

  const costRows = jobIds.length
    ? await prisma.$queryRaw<ServiceCostLineRow[]>(Prisma.sql`
        SELECT
          id,
          job_id AS "jobId",
          label,
          category,
          quantity,
          unit_label AS "unitLabel",
          unit_cost AS "unitCost",
          billable
        FROM service_cost_lines
        WHERE job_id IN (${Prisma.join(jobIds)})
        ORDER BY created_at ASC
      `)
    : [];

  const quotationRows = await prisma.$queryRaw<ServiceQuotationRow[]>(Prisma.sql`
    SELECT DISTINCT ON (request_id)
      id,
      request_id AS "requestId",
      job_id AS "jobId",
      quotation_code AS "quotationCode",
      status,
      discount_amount AS "discountAmount",
      tax_rate AS "taxRate",
      margin_rate AS "marginRate",
      total,
      valid_until AS "validUntil",
      approved_at AS "approvedAt"
    FROM service_quotations
    WHERE request_id IN (${Prisma.join(requestIds)})
    ORDER BY request_id, created_at DESC
  `);

  const invoiceRows = await prisma.$queryRaw<ServiceInvoiceRow[]>(Prisma.sql`
    SELECT DISTINCT ON (request_id)
      id,
      request_id AS "requestId",
      quotation_id AS "quotationId",
      invoice_code AS "invoiceCode",
      status,
      total,
      paid_amount AS "paidAmount",
      due_date AS "dueDate",
      paid_at AS "paidAt"
    FROM service_invoices
    WHERE request_id IN (${Prisma.join(requestIds)})
    ORDER BY request_id, created_at DESC
  `);

  const checklistRows = jobIds.length
    ? await prisma.$queryRaw<ServiceChecklistRow[]>(Prisma.sql`
        SELECT
          id,
          job_id AS "jobId",
          label,
          is_done AS "isDone"
        FROM service_checklist_items
        WHERE job_id IN (${Prisma.join(jobIds)})
        ORDER BY created_at ASC
      `)
    : [];

  const timelineRows = await prisma.$queryRaw<ServiceTimelineRow[]>(Prisma.sql`
    SELECT
      id,
      request_id AS "requestId",
      label,
      actor_name AS "actorName",
      occurred_at AS "occurredAt"
    FROM service_timeline_items
    WHERE request_id IN (${Prisma.join(requestIds)})
    ORDER BY occurred_at ASC
  `);

  const costByJob = groupBy(costRows, (row) => row.jobId);
  const checklistByJob = groupBy(checklistRows, (row) => row.jobId);
  const timelineByRequest = groupBy(timelineRows, (row) => row.requestId);
  const quoteByRequest = new Map(quotationRows.map((row) => [row.requestId, row]));
  const invoiceByRequest = new Map(invoiceRows.map((row) => [row.requestId, row]));

  return requestRows.map<ServiceBusinessJob>((request) => {
    const jobId = request.jobId ?? request.requestId;
    const costLines = (costByJob[jobId] ?? []).map<ServiceBusinessCostLine>((line) => ({
      id: line.id,
      label: line.label,
      category: line.category,
      quantity: Number(line.quantity),
      unitLabel: line.unitLabel,
      unitCost: Number(line.unitCost),
      billable: Boolean(line.billable),
    }));
    const quote = quoteByRequest.get(request.requestId);
    const invoice = invoiceByRequest.get(request.requestId);

    return {
      id: jobId,
      requestCode: request.requestCode,
      title: request.jobTitle ?? request.title,
      customerName: request.customerName,
      customerSegment: request.customerSegment ?? "General Service",
      serviceCategory: request.serviceCategory,
      status: request.jobStatus ?? request.requestStatus,
      priority: request.priority,
      assignedTo: request.assignedTo ?? "Unassigned",
      dueDate: toIsoDate(request.dueDate),
      summary: request.summary ?? "",
      costLines,
      checklist: (checklistByJob[jobId] ?? []).map((item) => item.label),
      quote: {
        id: quote?.id ?? "",
        code: quote?.quotationCode ?? "",
        status: quote?.status ?? "draft",
        validUntil: toIsoDate(quote?.validUntil),
        discountAmount: quote?.discountAmount ?? 0,
        taxRate: quote?.taxRate ?? 0,
        targetMarginRate: quote?.marginRate ?? 0,
        customerApprovedAt: toIsoDate(quote?.approvedAt) || null,
      },
      invoice: {
        id: invoice?.id ?? "",
        code: invoice?.invoiceCode ?? "",
        status: invoice?.status ?? "draft",
        dueDate: toIsoDate(invoice?.dueDate),
        paidAmount: invoice?.paidAmount ?? 0,
      },
      timeline: (timelineByRequest[request.requestId] ?? []).map((item) => ({
        label: item.label,
        at: item.occurredAt.toISOString(),
        actor: item.actorName,
      })),
    };
  });
}

async function findServiceJob(businessId: string, id: string) {
  const jobs = await loadServiceJobs(businessId);
  return jobs.find((job) => job.id === id || job.requestCode === id || job.quote.id === id || job.quote.code === id || job.invoice.id === id || job.invoice.code === id) ?? null;
}

async function findRequestForJob(businessId: string, id: string) {
  const rows = await prisma.$queryRaw<Array<{ requestId: string; jobId: string | null }>>(Prisma.sql`
    SELECT r.id AS "requestId", j.id AS "jobId"
    FROM service_requests r
    LEFT JOIN service_jobs j ON j.request_id = r.id
    WHERE r.business_id = ${businessId}
      AND (r.id = ${id} OR r.request_code = ${id} OR j.id = ${id})
    LIMIT 1
  `);

  return rows[0] ?? null;
}

router.get("/custom-business/service/workspace", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const jobs = await loadServiceJobs(businessContext.businessId);

    return successResponse(res, {
      data: {
        jobs,
        generatedAt: new Date().toISOString(),
        mode: "custom-business-service",
        dryRun: false,
        source: "api-server-prisma-sql",
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/custom-business/service/jobs", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const jobs = await loadServiceJobs(businessContext.businessId);

    return successResponse(res, {
      data: filterJobs(jobs, req.query as Record<string, unknown>),
      meta: {
        source: "api-server-prisma-sql",
        dryRun: false,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/requests", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = requireBodyObject(req.body);
    if (!body) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Request payload is required.",
      });
    }

    const title = getText(body.title);
    const customerName = getText(body.customerName);
    const customerSegment = getText(body.customerSegment) || "General Service";
    const serviceCategory = getText(body.serviceCategory);
    const priority = getText(body.priority).toUpperCase();
    const summary = getText(body.summary);
    const assignedTo = getText(body.assignedTo) || "Unassigned";
    const dueDate = getDate(body.dueDate);

    if (!title || !customerName || !serviceCategory || !isPriority(priority)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "customerName, serviceCategory, title, and valid priority are required.",
      });
    }

    const sequence = await getNextSequence(businessContext.businessId);
    const requestCode = `SRV-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
    const requestId = randomUUID();
    const jobId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_requests (
          id,
          business_id,
          request_code,
          customer_name,
          customer_segment,
          service_category,
          title,
          summary,
          status,
          priority,
          due_date,
          assigned_to
        ) VALUES (
          ${requestId},
          ${businessContext.businessId},
          ${requestCode},
          ${customerName},
          ${customerSegment},
          ${serviceCategory},
          ${title},
          ${summary || null},
          'REQUEST_INTAKE'::service_business_workflow_status,
          ${priority}::service_business_priority,
          ${dueDate},
          ${assignedTo}
        )
      `);

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_jobs (id, request_id, title, assigned_to, status)
        VALUES (${jobId}, ${requestId}, ${title}, ${assignedTo}, 'REQUEST_INTAKE'::service_business_workflow_status)
      `);

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_timeline_items (id, request_id, label, actor_name)
        VALUES (${randomUUID()}, ${requestId}, 'Request received', ${user.name ?? "System"})
      `);
    });

    const job = await findServiceJob(businessContext.businessId, jobId);

    return successResponse(res, {
      status: 201,
      message: "Service request created.",
      data: {
        success: true,
        dryRun: false,
        message: "Service request created.",
        job,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/jobs/:id/status", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = requireBodyObject(req.body);
    const target = await findRequestForJob(businessContext.businessId, req.params.id);

    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service job not found.",
      });
    }

    const nextStatus = getText(body?.nextStatus ?? body?.status).toUpperCase();
    if (!isStatus(nextStatus)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "nextStatus/status is required and must be a valid service status.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE service_requests
        SET status = ${nextStatus}::service_business_workflow_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${target.requestId}
      `);

      if (target.jobId) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE service_jobs
          SET status = ${nextStatus}::service_business_workflow_status,
              started_at = CASE WHEN ${nextStatus} = 'IN_PROGRESS' THEN COALESCE(started_at, CURRENT_TIMESTAMP) ELSE started_at END,
              completed_at = CASE WHEN ${nextStatus} IN ('DELIVERED', 'CLOSED') THEN COALESCE(completed_at, CURRENT_TIMESTAMP) ELSE completed_at END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${target.jobId}
        `);
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_timeline_items (id, request_id, label, actor_name)
        VALUES (${randomUUID()}, ${target.requestId}, ${`Status updated to ${nextStatus}`}, ${user.name ?? "System"})
      `);
    });

    const job = await findServiceJob(businessContext.businessId, target.jobId ?? target.requestId);

    return successResponse(res, {
      data: {
        success: true,
        dryRun: false,
        message: `Status changed to ${nextStatus}.`,
        job,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/jobs/:id/cost-lines", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = requireBodyObject(req.body);
    const target = await findRequestForJob(businessContext.businessId, req.params.id);

    if (!target?.jobId) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service job not found.",
      });
    }

    const label = getText(body?.label);
    const category = getText(body?.category).toLowerCase();
    const quantity = getFiniteNumber(body?.quantity);
    const unitCost = getFiniteNumber(body?.unitCost);
    const unitLabel = getText(body?.unitLabel) || "unit";

    if (!label || !isCostCategory(category) || quantity === null || quantity <= 0 || unitCost === null || unitCost < 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "label, category, quantity, unitLabel, and unitCost are required.",
      });
    }

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO service_cost_lines (id, job_id, label, category, quantity, unit_label, unit_cost, billable)
      VALUES (${randomUUID()}, ${target.jobId}, ${label}, ${category}::service_business_cost_category, ${quantity}, ${unitLabel}, ${Math.round(unitCost)}, ${Boolean(body?.billable)})
    `);

    const job = await findServiceJob(businessContext.businessId, target.jobId);

    return successResponse(res, {
      status: 201,
      data: {
        success: true,
        dryRun: false,
        message: "Service cost line created.",
        job,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/quotations", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = requireBodyObject(req.body);
    const target = await findRequestForJob(businessContext.businessId, getText(body?.requestId));

    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service request/job not found for quotation.",
      });
    }

    const job = await findServiceJob(businessContext.businessId, target.jobId ?? target.requestId);
    const costTotal = calculateCostTotal(job?.costLines ?? []);
    const discountAmount = Math.round(getFiniteNumber(body?.discountAmount) ?? 0);
    const taxRate = getFiniteNumber(body?.taxRate) ?? 0;
    const targetMarginRate = getFiniteNumber(body?.targetMarginRate) ?? 0.3;
    const total = calculateQuoteTotalFromCost({ costTotal, discountAmount, taxRate, targetMarginRate });
    const afterDiscount = Math.max(Math.round(costTotal / Math.max(1 - targetMarginRate, 0.01)) - discountAmount, 0);
    const taxAmount = Math.max(total - afterDiscount, 0);
    const quotationId = randomUUID();
    const quotationCode = `QUO-${Date.now().toString().slice(-8)}`;
    const validUntil = getDate(body?.validUntil);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_quotations (
          id,
          request_id,
          job_id,
          quotation_code,
          status,
          subtotal,
          discount_amount,
          tax_rate,
          tax_amount,
          margin_rate,
          total,
          valid_until
        ) VALUES (
          ${quotationId},
          ${target.requestId},
          ${target.jobId},
          ${quotationCode},
          'draft'::service_business_quote_status,
          ${costTotal},
          ${discountAmount},
          ${taxRate},
          ${taxAmount},
          ${targetMarginRate},
          ${total},
          ${validUntil}
        )
      `);

      await tx.$executeRaw(Prisma.sql`
        UPDATE service_requests
        SET status = 'QUOTATION_DRAFT'::service_business_workflow_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${target.requestId}
      `);

      if (target.jobId) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE service_jobs
          SET status = 'QUOTATION_DRAFT'::service_business_workflow_status,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${target.jobId}
        `);
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_timeline_items (id, request_id, label, actor_name)
        VALUES (${randomUUID()}, ${target.requestId}, 'Quotation drafted', ${user.name ?? "System"})
      `);
    });

    const updatedJob = await findServiceJob(businessContext.businessId, target.jobId ?? target.requestId);

    return successResponse(res, {
      status: 201,
      data: {
        success: true,
        dryRun: false,
        message: "Service quotation created.",
        job: updatedJob,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/quotations/:id/approve", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const rows = await prisma.$queryRaw<Array<{ requestId: string; jobId: string | null }>>(Prisma.sql`
      SELECT q.request_id AS "requestId", q.job_id AS "jobId"
      FROM service_quotations q
      JOIN service_requests r ON r.id = q.request_id
      WHERE r.business_id = ${businessContext.businessId}
        AND (q.id = ${req.params.id} OR q.quotation_code = ${req.params.id})
      LIMIT 1
    `);
    const target = rows[0];

    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service quotation not found.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE service_quotations
        SET status = 'approved'::service_business_quote_status,
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${req.params.id} OR quotation_code = ${req.params.id}
      `);

      await tx.$executeRaw(Prisma.sql`
        UPDATE service_requests
        SET status = 'QUOTATION_APPROVED'::service_business_workflow_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${target.requestId}
      `);

      if (target.jobId) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE service_jobs
          SET status = 'QUOTATION_APPROVED'::service_business_workflow_status,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${target.jobId}
        `);
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_timeline_items (id, request_id, label, actor_name)
        VALUES (${randomUUID()}, ${target.requestId}, 'Quotation approved', ${user.name ?? "System"})
      `);
    });

    const job = await findServiceJob(businessContext.businessId, target.jobId ?? target.requestId);

    return successResponse(res, {
      data: {
        success: true,
        dryRun: false,
        message: "Quotation approved.",
        job,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/invoices", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = requireBodyObject(req.body);
    const target = await findRequestForJob(businessContext.businessId, getText(body?.requestId));

    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service request/job not found for invoice.",
      });
    }

    const job = await findServiceJob(businessContext.businessId, target.jobId ?? target.requestId);
    const invoiceId = randomUUID();
    const invoiceCode = `INV-${Date.now().toString().slice(-8)}`;
    const quoteTotal = job
      ? calculateQuoteTotalFromCost({
          costTotal: calculateCostTotal(job.costLines),
          discountAmount: job.quote.discountAmount,
          taxRate: job.quote.taxRate,
          targetMarginRate: job.quote.targetMarginRate,
        })
      : 0;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_invoices (
          id,
          request_id,
          quotation_id,
          invoice_code,
          status,
          total,
          paid_amount,
          due_date,
          issued_at
        ) VALUES (
          ${invoiceId},
          ${target.requestId},
          ${getText(body?.quotationId) || null},
          ${invoiceCode},
          'issued'::service_business_invoice_status,
          ${quoteTotal},
          0,
          ${getDate(body?.dueDate)},
          CURRENT_TIMESTAMP
        )
      `);

      await tx.$executeRaw(Prisma.sql`
        UPDATE service_requests
        SET status = 'INVOICED'::service_business_workflow_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${target.requestId}
      `);

      if (target.jobId) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE service_jobs
          SET status = 'INVOICED'::service_business_workflow_status,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${target.jobId}
        `);
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_timeline_items (id, request_id, label, actor_name)
        VALUES (${randomUUID()}, ${target.requestId}, 'Invoice issued', ${user.name ?? "System"})
      `);
    });

    const updatedJob = await findServiceJob(businessContext.businessId, target.jobId ?? target.requestId);

    return successResponse(res, {
      status: 201,
      data: {
        success: true,
        dryRun: false,
        message: "Service invoice created.",
        job: updatedJob,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/invoices/:id/payment", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = requireBodyObject(req.body);
    const paidAmount = getFiniteNumber(body?.paidAmount);

    if (paidAmount === null || paidAmount <= 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "paidAmount must be greater than 0.",
      });
    }

    const rows = await prisma.$queryRaw<Array<{ requestId: string; jobId: string | null; invoiceTotal: number; currentPaidAmount: number }>>(Prisma.sql`
      SELECT
        i.request_id AS "requestId",
        j.id AS "jobId",
        i.total AS "invoiceTotal",
        i.paid_amount AS "currentPaidAmount"
      FROM service_invoices i
      JOIN service_requests r ON r.id = i.request_id
      LEFT JOIN service_jobs j ON j.request_id = r.id
      WHERE r.business_id = ${businessContext.businessId}
        AND (i.id = ${req.params.id} OR i.invoice_code = ${req.params.id})
      LIMIT 1
    `);
    const target = rows[0];

    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service invoice not found.",
      });
    }

    const nextPaidAmount = Math.min(Math.round(target.currentPaidAmount + paidAmount), target.invoiceTotal);
    const nextStatus: ServiceBusinessInvoiceStatus = nextPaidAmount >= target.invoiceTotal ? "paid" : "partial";
    const nextWorkflowStatus: ServiceBusinessWorkflowStatus = nextStatus === "paid" ? "PAID" : "INVOICED";

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE service_invoices
        SET paid_amount = ${nextPaidAmount},
            status = ${nextStatus}::service_business_invoice_status,
            paid_at = CASE WHEN ${nextStatus} = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${req.params.id} OR invoice_code = ${req.params.id}
      `);

      await tx.$executeRaw(Prisma.sql`
        UPDATE service_requests
        SET status = ${nextWorkflowStatus}::service_business_workflow_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${target.requestId}
      `);

      if (target.jobId) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE service_jobs
          SET status = ${nextWorkflowStatus}::service_business_workflow_status,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${target.jobId}
        `);
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO service_timeline_items (id, request_id, label, actor_name)
        VALUES (${randomUUID()}, ${target.requestId}, ${`Payment recorded: ${Math.round(paidAmount)}`}, ${user.name ?? "System"})
      `);
    });

    const job = await findServiceJob(businessContext.businessId, target.jobId ?? target.requestId);

    return successResponse(res, {
      data: {
        success: true,
        dryRun: false,
        message: "Service invoice payment recorded.",
        job,
        preview: {
          invoiceId: req.params.id,
          paidAmount: Math.round(paidAmount),
          paymentMethod: getText(body?.paymentMethod) || "other",
          paidAt: getText(body?.paidAt) || new Date().toISOString(),
          note: getText(body?.note) || null,
          projectedCollectionRate: job ? calculateCollectionRate(job) : 0,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
