import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { ServiceWorkflowReadinessRow, ServiceWorkflowTargetRow } from "./service-business.types.js";

export async function findServiceWorkflowTarget(businessId: string, id: string) {
  const rows = await prisma.$queryRaw<ServiceWorkflowTargetRow[]>(Prisma.sql`
    SELECT
      r.id AS "requestId",
      r.request_code AS "requestCode",
      j.id AS "jobId",
      COALESCE(j.status, r.status) AS "currentStatus",
      r.summary AS "summary"
    FROM service_requests r
    LEFT JOIN service_jobs j ON j.request_id = r.id
    WHERE r.business_id = ${businessId}
      AND (r.id = ${id} OR r.request_code = ${id} OR j.id = ${id})
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function loadServiceWorkflowReadiness(target: ServiceWorkflowTargetRow) {
  const rows = await prisma.$queryRaw<ServiceWorkflowReadinessRow[]>(Prisma.sql`
    SELECT
      (${Boolean(target.summary?.trim())})::boolean AS "hasSummary",
      EXISTS (
        SELECT 1 FROM service_cost_lines c
        WHERE c.job_id = ${target.jobId}
      ) AS "hasCostLines",
      EXISTS (
        SELECT 1 FROM service_cost_lines c
        WHERE c.job_id = ${target.jobId}
          AND c.billable = true
          AND (c.quantity * c.unit_cost) > 0
      ) AS "hasBillableCost",
      EXISTS (
        SELECT 1 FROM service_quotations q
        WHERE q.request_id = ${target.requestId}
      ) AS "hasQuotation",
      EXISTS (
        SELECT 1 FROM service_quotations q
        WHERE q.request_id = ${target.requestId}
          AND q.status = 'approved'::service_business_quote_status
      ) AS "hasApprovedQuotation",
      EXISTS (
        SELECT 1 FROM service_invoices i
        WHERE i.request_id = ${target.requestId}
      ) AS "hasInvoice",
      EXISTS (
        SELECT 1 FROM service_invoices i
        WHERE i.request_id = ${target.requestId}
          AND i.status = 'paid'::service_business_invoice_status
      ) AS "hasPaidInvoice",
      COALESCE((
        SELECT COUNT(*)::int FROM service_checklist_items ci
        WHERE ci.job_id = ${target.jobId}
      ), 0) AS "checklistCount"
  `);

  return rows[0] ?? {
    hasSummary: false,
    hasCostLines: false,
    hasBillableCost: false,
    hasQuotation: false,
    hasApprovedQuotation: false,
    hasInvoice: false,
    hasPaidInvoice: false,
    checklistCount: 0,
  };
}
