import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  ServiceBusinessCostCategory,
  ServiceBusinessCostLine,
  ServiceBusinessInvoiceStatus,
  ServiceBusinessJob,
  ServiceBusinessPriority,
  ServiceBusinessQuoteStatus,
  ServiceBusinessWorkflowStatus,
} from "./service-business.types.js";

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
  validUntil: Date | null;
  approvedAt: Date | null;
};

type ServiceInvoiceRow = {
  id: string;
  requestId: string;
  quotationId: string | null;
  invoiceCode: string;
  status: ServiceBusinessInvoiceStatus;
  paidAmount: number;
  dueDate: Date | null;
};

type ServiceChecklistRow = {
  jobId: string;
  label: string;
};

type ServiceTimelineRow = {
  requestId: string;
  label: string;
  actorName: string;
  occurredAt: Date;
};

export type ServiceRequestTarget = {
  requestId: string;
  jobId: string | null;
};

export type ServiceQuotationTarget = ServiceRequestTarget & {
  quotationId: string;
};

export type ServiceInvoiceTarget = ServiceRequestTarget & {
  invoiceId: string;
  invoiceTotal: number;
  currentPaidAmount: number;
};

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function groupBy<TItem, TKey extends string>(items: readonly TItem[], getKey: (item: TItem) => TKey) {
  return items.reduce<Record<TKey, TItem[]>>((result, item) => {
    const key = getKey(item);
    result[key] ??= [];
    result[key].push(item);
    return result;
  }, {} as Record<TKey, TItem[]>);
}

export async function getServiceRequestNextSequence(businessId: string) {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM service_requests
    WHERE business_id = ${businessId}
  `);

  return Number(rows[0]?.count ?? 0) + 1;
}

export async function loadServiceJobs(businessId: string) {
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
      paid_amount AS "paidAmount",
      due_date AS "dueDate"
    FROM service_invoices
    WHERE request_id IN (${Prisma.join(requestIds)})
    ORDER BY request_id, created_at DESC
  `);

  const checklistRows = jobIds.length
    ? await prisma.$queryRaw<ServiceChecklistRow[]>(Prisma.sql`
        SELECT job_id AS "jobId", label
        FROM service_checklist_items
        WHERE job_id IN (${Prisma.join(jobIds)})
        ORDER BY created_at ASC
      `)
    : [];

  const timelineRows = await prisma.$queryRaw<ServiceTimelineRow[]>(Prisma.sql`
    SELECT
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

export async function findServiceJob(businessId: string, id: string) {
  const jobs = await loadServiceJobs(businessId);
  return jobs.find((job) => job.id === id || job.requestCode === id || job.quote.id === id || job.quote.code === id || job.invoice.id === id || job.invoice.code === id) ?? null;
}

export async function findServiceRequestTarget(businessId: string, id: string) {
  const rows = await prisma.$queryRaw<ServiceRequestTarget[]>(Prisma.sql`
    SELECT r.id AS "requestId", j.id AS "jobId"
    FROM service_requests r
    LEFT JOIN service_jobs j ON j.request_id = r.id
    WHERE r.business_id = ${businessId}
      AND (r.id = ${id} OR r.request_code = ${id} OR j.id = ${id})
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function findServiceQuotationTarget(businessId: string, id: string) {
  const rows = await prisma.$queryRaw<ServiceQuotationTarget[]>(Prisma.sql`
    SELECT q.id AS "quotationId", q.request_id AS "requestId", q.job_id AS "jobId"
    FROM service_quotations q
    JOIN service_requests r ON r.id = q.request_id
    WHERE r.business_id = ${businessId}
      AND (q.id = ${id} OR q.quotation_code = ${id})
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function findServiceInvoiceTarget(businessId: string, id: string) {
  const rows = await prisma.$queryRaw<ServiceInvoiceTarget[]>(Prisma.sql`
    SELECT
      i.id AS "invoiceId",
      i.request_id AS "requestId",
      j.id AS "jobId",
      i.total AS "invoiceTotal",
      i.paid_amount AS "currentPaidAmount"
    FROM service_invoices i
    JOIN service_requests r ON r.id = i.request_id
    LEFT JOIN service_jobs j ON j.request_id = r.id
    WHERE r.business_id = ${businessId}
      AND (i.id = ${id} OR i.invoice_code = ${id})
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function createServiceRequestRecord({
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
}: {
  businessId: string;
  requestCode: string;
  title: string;
  customerName: string;
  customerSegment: string;
  serviceCategory: string;
  priority: ServiceBusinessPriority;
  summary: string;
  assignedTo: string;
  dueDate: Date | null;
  actorName: string;
}) {
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
        ${businessId},
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
      VALUES (${randomUUID()}, ${requestId}, 'Request received', ${actorName})
    `);
  });

  return { requestId, jobId };
}

export async function createServiceCostLineRecord({
  target,
  label,
  category,
  quantity,
  unitLabel,
  unitCost,
  billable,
}: {
  target: ServiceRequestTarget;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
}) {
  if (!target.jobId) return;

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO service_cost_lines (id, job_id, label, category, quantity, unit_label, unit_cost, billable)
    VALUES (${randomUUID()}, ${target.jobId}, ${label}, ${category}::service_business_cost_category, ${quantity}, ${unitLabel}, ${Math.round(unitCost)}, ${billable})
  `);
}

export async function createServiceQuotationRecord({
  target,
  costTotal,
  discountAmount,
  taxRate,
  targetMarginRate,
  total,
  taxAmount,
  validUntil,
  actorName,
}: {
  target: ServiceRequestTarget;
  costTotal: number;
  discountAmount: number;
  taxRate: number;
  targetMarginRate: number;
  total: number;
  taxAmount: number;
  validUntil: Date | null;
  actorName: string;
}) {
  const quotationId = randomUUID();
  const quotationCode = `QUO-${Date.now().toString().slice(-8)}`;

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
      VALUES (${randomUUID()}, ${target.requestId}, 'Quotation drafted', ${actorName})
    `);
  });

  return { quotationId, quotationCode };
}

export async function approveServiceQuotationRecord({
  target,
  actorName,
}: {
  target: ServiceQuotationTarget;
  actorName: string;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE service_quotations
      SET status = 'approved'::service_business_quote_status,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${target.quotationId}
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
      VALUES (${randomUUID()}, ${target.requestId}, 'Quotation approved', ${actorName})
    `);
  });
}

export async function createServiceInvoiceRecord({
  target,
  quotationId,
  total,
  dueDate,
  actorName,
}: {
  target: ServiceRequestTarget;
  quotationId: string | null;
  total: number;
  dueDate: Date | null;
  actorName: string;
}) {
  const invoiceId = randomUUID();
  const invoiceCode = `INV-${Date.now().toString().slice(-8)}`;

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
        ${quotationId},
        ${invoiceCode},
        'issued'::service_business_invoice_status,
        ${total},
        0,
        ${dueDate},
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
      VALUES (${randomUUID()}, ${target.requestId}, 'Invoice issued', ${actorName})
    `);
  });

  return { invoiceId, invoiceCode };
}

export async function recordServiceInvoicePaymentRecord({
  target,
  paidAmount,
  nextPaidAmount,
  nextInvoiceStatus,
  nextWorkflowStatus,
  actorName,
}: {
  target: ServiceInvoiceTarget;
  paidAmount: number;
  nextPaidAmount: number;
  nextInvoiceStatus: ServiceBusinessInvoiceStatus;
  nextWorkflowStatus: ServiceBusinessWorkflowStatus;
  actorName: string;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE service_invoices
      SET paid_amount = ${nextPaidAmount},
          status = ${nextInvoiceStatus}::service_business_invoice_status,
          paid_at = CASE WHEN ${nextInvoiceStatus} = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${target.invoiceId}
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
      VALUES (${randomUUID()}, ${target.requestId}, ${`Payment recorded: ${Math.round(paidAmount)}`}, ${actorName})
    `);
  });
}
