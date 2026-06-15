import { InvoiceStatus } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

type LifecycleStatus = InvoiceStatus.SENT | InvoiceStatus.PAID;

function isPlannedInvoiceMode(businessMode: string) {
  return businessMode === "custom-business";
}

function getPlannedReason(businessMode: string) {
  if (!isPlannedInvoiceMode(businessMode)) return null;
  return "Service/custom business invoice lifecycle is planned and not operational yet.";
}

function parseTargetStatus(value: unknown): LifecycleStatus | null {
  const status = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (status === InvoiceStatus.SENT) return InvoiceStatus.SENT;
  if (status === InvoiceStatus.PAID) return InvoiceStatus.PAID;
  return null;
}

function validateStatusTransition(current: InvoiceStatus, target: LifecycleStatus) {
  if (current === InvoiceStatus.CANCELLED) {
    return "Cancelled invoices cannot be moved back into the active lifecycle.";
  }

  if (current === InvoiceStatus.PAID) {
    return target === InvoiceStatus.PAID ? null : "Paid invoices cannot be marked as sent.";
  }

  if (target === InvoiceStatus.SENT) {
    return current === InvoiceStatus.DRAFT || current === InvoiceStatus.SENT
      ? null
      : "Only draft invoices can be marked as sent.";
  }

  if (target === InvoiceStatus.PAID) {
    return current === InvoiceStatus.DRAFT || current === InvoiceStatus.SENT || current === InvoiceStatus.PAID
      ? null
      : "Only draft or sent invoices can be marked as paid.";
  }

  return "Invalid invoice status transition.";
}

router.patch("/invoices/:id/status", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const plannedReason = getPlannedReason(businessContext.businessMode);
    if (plannedReason) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: plannedReason,
      });
    }

    const targetStatus = parseTargetStatus((req.body as { status?: unknown } | null | undefined)?.status);
    if (!targetStatus) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invoice status must be SENT or PAID.",
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId: businessContext.businessId },
    });

    if (!invoice) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Invoice not found.",
      });
    }

    const transitionError = validateStatusTransition(invoice.status, targetStatus);
    if (transitionError) {
      return errorResponse(res, {
        status: 409,
        code: errorCodes.conflict,
        message: transitionError,
      });
    }

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: targetStatus,
        cancelledAt: null,
      },
      include: { items: { orderBy: { id: "asc" } } },
    });

    return successResponse(res, {
      data: updated,
      message: `Invoice marked as ${targetStatus.toLowerCase()}.`,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
