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

const serviceStatuses = [
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

type ServiceBusinessWorkflowStatus = (typeof serviceStatuses)[number];

type ServiceTransitionRequirement = {
  id: string;
  label: string;
  isMet: boolean;
  missingReason?: string;
};

type ServiceWorkflowTargetRow = {
  requestId: string;
  requestCode: string;
  jobId: string | null;
  currentStatus: ServiceBusinessWorkflowStatus;
  summary: string | null;
};

type ServiceWorkflowReadinessRow = {
  hasSummary: boolean;
  hasCostLines: boolean;
  hasBillableCost: boolean;
  hasQuotation: boolean;
  hasApprovedQuotation: boolean;
  hasInvoice: boolean;
  hasPaidInvoice: boolean;
  checklistCount: number;
};

const allowedTransitions: Record<ServiceBusinessWorkflowStatus, readonly ServiceBusinessWorkflowStatus[]> = {
  REQUEST_INTAKE: ["JOB_PLANNING", "REJECTED", "CANCELLED"],
  JOB_PLANNING: ["QUOTATION_DRAFT", "CANCELLED"],
  QUOTATION_DRAFT: ["QUOTATION_APPROVED", "REJECTED", "CANCELLED"],
  QUOTATION_APPROVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["READY_FOR_REVIEW", "CANCELLED"],
  READY_FOR_REVIEW: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["INVOICED"],
  INVOICED: ["PAID"],
  PAID: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
  REJECTED: [],
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isServiceStatus(value: string): value is ServiceBusinessWorkflowStatus {
  return serviceStatuses.includes(value as ServiceBusinessWorkflowStatus);
}

function requireBodyObject(reqBody: unknown) {
  return typeof reqBody === "object" && reqBody !== null ? (reqBody as Record<string, unknown>) : null;
}

function buildRequirement(
  id: string,
  label: string,
  isMet: boolean,
  missingReason: string,
): ServiceTransitionRequirement {
  return isMet ? { id, label, isMet } : { id, label, isMet, missingReason };
}

function getTransitionRequirements(
  nextStatus: ServiceBusinessWorkflowStatus,
  readiness: ServiceWorkflowReadinessRow,
): readonly ServiceTransitionRequirement[] {
  switch (nextStatus) {
    case "JOB_PLANNING":
      return [
        buildRequirement(
          "summary",
          "Request summary exists",
          readiness.hasSummary,
          "Add a short request summary before planning the job.",
        ),
      ];
    case "QUOTATION_DRAFT":
      return [
        buildRequirement(
          "cost-lines",
          "Job has at least one cost line",
          readiness.hasCostLines,
          "Add labor/material/operation/vendor cost lines before drafting a quotation.",
        ),
        buildRequirement(
          "billable-cost",
          "Job has billable cost basis",
          readiness.hasBillableCost,
          "Add at least one billable cost line with a positive value.",
        ),
      ];
    case "QUOTATION_APPROVED":
      return [
        buildRequirement(
          "quotation",
          "Quotation draft exists",
          readiness.hasQuotation,
          "Create a quotation before marking it approved.",
        ),
      ];
    case "IN_PROGRESS":
      return [
        buildRequirement(
          "approved-quotation",
          "Approved quotation exists",
          readiness.hasApprovedQuotation,
          "Approve the quotation before starting work.",
        ),
      ];
    case "READY_FOR_REVIEW":
      return [
        buildRequirement(
          "checklist",
          "Execution checklist exists",
          readiness.checklistCount > 0,
          "Add checklist items before moving the job to review.",
        ),
      ];
    case "INVOICED":
      return [
        buildRequirement(
          "approved-quotation",
          "Approved quotation exists",
          readiness.hasApprovedQuotation,
          "Approved quote is required before issuing an invoice.",
        ),
      ];
    case "PAID":
      return [
        buildRequirement(
          "invoice",
          "Invoice exists",
          readiness.hasInvoice,
          "Create an invoice before recording paid status.",
        ),
      ];
    case "CLOSED":
      return [
        buildRequirement(
          "paid-invoice",
          "Invoice is fully paid",
          readiness.hasPaidInvoice,
          "Record full payment before closing the service job.",
        ),
      ];
    default:
      return [];
  }
}

async function findWorkflowTarget(businessId: string, id: string) {
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

async function loadWorkflowReadiness(target: ServiceWorkflowTargetRow) {
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

function buildTransitionPreview(
  target: ServiceWorkflowTargetRow,
  nextStatus: ServiceBusinessWorkflowStatus,
  readiness: ServiceWorkflowReadinessRow,
) {
  const allowedNextStatuses = allowedTransitions[target.currentStatus] ?? [];
  const isAllowedTransition = allowedNextStatuses.includes(nextStatus);
  const requirements = getTransitionRequirements(nextStatus, readiness);
  const unmetRequirements = requirements.filter((requirement) => !requirement.isMet);
  const canTransition = isAllowedTransition && unmetRequirements.length === 0;

  return {
    requestId: target.requestId,
    requestCode: target.requestCode,
    jobId: target.jobId,
    currentStatus: target.currentStatus,
    nextStatus,
    allowedNextStatuses,
    isAllowedTransition,
    canTransition,
    requirements,
    unmetRequirements,
  };
}

router.get("/custom-business/service/workflow/statuses", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    await requireBusinessContextForUser(user);

    return successResponse(res, {
      data: {
        statuses: serviceStatuses,
        transitions: allowedTransitions,
        source: "api-server-prisma-sql-workflow-guard",
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/custom-business/service/jobs/:id/transition-preview", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const nextStatus = getText(req.query.nextStatus).toUpperCase();

    if (!isServiceStatus(nextStatus)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "nextStatus is required and must be a valid service status.",
      });
    }

    const target = await findWorkflowTarget(businessContext.businessId, req.params.id ?? "");
    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service job not found.",
      });
    }

    const readiness = await loadWorkflowReadiness(target);

    return successResponse(res, {
      data: buildTransitionPreview(target, nextStatus, readiness),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/jobs/:id/guarded-status", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = requireBodyObject(req.body);
    const nextStatus = getText(body?.nextStatus ?? body?.status).toUpperCase();
    const note = getText(body?.note);

    if (!isServiceStatus(nextStatus)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "nextStatus/status is required and must be a valid service status.",
      });
    }

    const target = await findWorkflowTarget(businessContext.businessId, req.params.id ?? "");
    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service job not found.",
      });
    }

    const readiness = await loadWorkflowReadiness(target);
    const preview = buildTransitionPreview(target, nextStatus, readiness);

    if (!preview.isAllowedTransition) {
      return errorResponse(res, {
        status: 409,
        code: errorCodes.validationError,
        message: `Cannot move service job from ${target.currentStatus} to ${nextStatus}.`,
      });
    }

    if (preview.unmetRequirements.length > 0) {
      return errorResponse(res, {
        status: 422,
        code: errorCodes.validationError,
        message: "Service transition requirements are not met.",
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
        INSERT INTO service_timeline_items (id, request_id, label, actor_name, metadata)
        VALUES (
          gen_random_uuid()::text,
          ${target.requestId},
          ${note ? `Status updated to ${nextStatus}: ${note}` : `Status updated to ${nextStatus}`},
          ${user.name ?? "System"},
          ${JSON.stringify({ source: "guarded-status", previousStatus: target.currentStatus, nextStatus })}::jsonb
        )
      `);
    });

    return successResponse(res, {
      data: {
        success: true,
        dryRun: false,
        message: `Status changed to ${nextStatus}.`,
        transition: preview,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
