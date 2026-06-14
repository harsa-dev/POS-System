import { randomUUID } from "node:crypto";

import {
  ServiceBusinessInvoiceStatus as PrismaServiceBusinessInvoiceStatus,
  ServiceBusinessQuoteStatus as PrismaServiceBusinessQuoteStatus,
  ServiceBusinessWorkflowStatus as PrismaServiceBusinessWorkflowStatus,
} from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import type { ServiceBusinessMutationResult } from "./service-business.types.js";
import type { ServiceBusinessResult } from "./service-business.crud.service.js";
import { findServiceJob } from "./service-business.crud.repository.js";

type ReversalResult = ServiceBusinessResult<ServiceBusinessMutationResult>;

type CancelServiceQuotationInput = {
  businessId: string;
  actorName: string;
  id: string;
  note?: string;
};

type CancelServiceInvoiceInput = {
  businessId: string;
  actorName: string;
  id: string;
  note?: string;
};

type ReverseServiceInvoicePaymentInput = {
  businessId: string;
  actorName: string;
  id: string;
  amount?: number | null;
  note?: string;
};

function conflict(message: string): ReversalResult {
  return {
    ok: false,
    status: 409,
    code: errorCodes.conflict,
    message,
  };
}

function notFound(message: string): ReversalResult {
  return {
    ok: false,
    status: 404,
    code: errorCodes.notFound,
    message,
  };
}

function validationError(message: string): ReversalResult {
  return {
    ok: false,
    status: 400,
    code: errorCodes.validationError,
    message,
  };
}

function ok(message: string, job: ServiceBusinessMutationResult["job"], preview: Record<string, unknown>): ReversalResult {
  return {
    ok: true,
    data: {
      success: true,
      dryRun: false,
      message,
      job,
      preview,
    },
  };
}

function buildTimelineLabel(action: string, note?: string) {
  return note ? `${action}: ${note}` : action;
}

function getInvoiceStatusAfterPaymentReversal(total: number, nextPaidAmount: number) {
  if (nextPaidAmount <= 0) return PrismaServiceBusinessInvoiceStatus.ISSUED;
  if (nextPaidAmount >= total) return PrismaServiceBusinessInvoiceStatus.PAID;
  return PrismaServiceBusinessInvoiceStatus.PARTIAL;
}

function getWorkflowStatusAfterPaymentReversal(nextInvoiceStatus: PrismaServiceBusinessInvoiceStatus) {
  return nextInvoiceStatus === PrismaServiceBusinessInvoiceStatus.PAID
    ? PrismaServiceBusinessWorkflowStatus.PAID
    : PrismaServiceBusinessWorkflowStatus.INVOICED;
}

export async function cancelServiceBusinessQuotation({
  businessId,
  actorName,
  id,
  note,
}: CancelServiceQuotationInput): Promise<ReversalResult> {
  const quotation = await prisma.serviceQuotation.findFirst({
    where: {
      OR: [{ id }, { quotationCode: id }],
      request: { businessId },
    },
    include: {
      request: {
        include: {
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          invoices: {
            select: {
              id: true,
              invoiceCode: true,
              status: true,
              paidAmount: true,
            },
          },
        },
      },
    },
  });

  if (!quotation) return notFound("Service quotation not found.");

  const currentStatus = quotation.status;
  if (
    currentStatus === PrismaServiceBusinessQuoteStatus.REJECTED ||
    currentStatus === PrismaServiceBusinessQuoteStatus.EXPIRED
  ) {
    return conflict("Service quotation is already closed and cannot be cancelled again.");
  }

  const linkedInvoices = quotation.request.invoices.filter(
    (invoice) => invoice.status !== PrismaServiceBusinessInvoiceStatus.CANCELLED,
  );
  if (linkedInvoices.length > 0) {
    return conflict("Cancel linked invoices before cancelling this quotation.");
  }

  const previousWorkflowStatus = quotation.request.status;
  const nextWorkflowStatus = PrismaServiceBusinessWorkflowStatus.JOB_PLANNING;
  const jobId = quotation.jobId ?? quotation.request.jobs[0]?.id ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.serviceQuotation.update({
      where: { id: quotation.id },
      data: {
        status: PrismaServiceBusinessQuoteStatus.REJECTED,
        approvedAt: null,
      },
    });

    await tx.serviceRequest.update({
      where: { id: quotation.requestId },
      data: { status: nextWorkflowStatus },
    });

    if (jobId) {
      await tx.serviceJob.update({
        where: { id: jobId },
        data: { status: nextWorkflowStatus },
      });
    }

    await tx.serviceTimelineItem.create({
      data: {
        id: randomUUID(),
        requestId: quotation.requestId,
        label: buildTimelineLabel("Quotation cancelled", note),
        actorName,
      },
    });
  });

  const job = await findServiceJob(businessId, jobId ?? quotation.requestId);

  return ok("Service quotation cancelled.", job, {
    type: "quotation-cancellation",
    quotationId: quotation.id,
    quotationCode: quotation.quotationCode,
    previousQuoteStatus: currentStatus,
    nextQuoteStatus: PrismaServiceBusinessQuoteStatus.REJECTED,
    previousWorkflowStatus,
    nextWorkflowStatus,
    note: note ?? null,
  });
}

export async function cancelServiceBusinessInvoice({
  businessId,
  actorName,
  id,
  note,
}: CancelServiceInvoiceInput): Promise<ReversalResult> {
  const invoice = await prisma.serviceInvoice.findFirst({
    where: {
      OR: [{ id }, { invoiceCode: id }],
      request: { businessId },
    },
    include: {
      request: {
        include: {
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      quotation: {
        select: {
          id: true,
          quotationCode: true,
          status: true,
        },
      },
    },
  });

  if (!invoice) return notFound("Service invoice not found.");

  if (invoice.status === PrismaServiceBusinessInvoiceStatus.CANCELLED) {
    return conflict("Service invoice is already cancelled.");
  }

  if (invoice.paidAmount > 0 || invoice.status === PrismaServiceBusinessInvoiceStatus.PAID) {
    return conflict("Cancel invoice payment first before cancelling this invoice.");
  }

  const previousWorkflowStatus = invoice.request.status;
  const nextWorkflowStatus = PrismaServiceBusinessWorkflowStatus.DELIVERED;
  const jobId = invoice.request.jobs[0]?.id ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.serviceInvoice.update({
      where: { id: invoice.id },
      data: {
        status: PrismaServiceBusinessInvoiceStatus.CANCELLED,
        paidAt: null,
      },
    });

    await tx.serviceRequest.update({
      where: { id: invoice.requestId },
      data: { status: nextWorkflowStatus },
    });

    if (jobId) {
      await tx.serviceJob.update({
        where: { id: jobId },
        data: { status: nextWorkflowStatus },
      });
    }

    await tx.serviceTimelineItem.create({
      data: {
        id: randomUUID(),
        requestId: invoice.requestId,
        label: buildTimelineLabel("Invoice cancelled", note),
        actorName,
      },
    });
  });

  const job = await findServiceJob(businessId, jobId ?? invoice.requestId);

  return ok("Service invoice cancelled.", job, {
    type: "invoice-cancellation",
    invoiceId: invoice.id,
    invoiceCode: invoice.invoiceCode,
    previousInvoiceStatus: invoice.status,
    nextInvoiceStatus: PrismaServiceBusinessInvoiceStatus.CANCELLED,
    previousWorkflowStatus,
    nextWorkflowStatus,
    quotationId: invoice.quotation?.id ?? null,
    quotationCode: invoice.quotation?.quotationCode ?? null,
    note: note ?? null,
  });
}

export async function reverseServiceBusinessInvoicePayment({
  businessId,
  actorName,
  id,
  amount,
  note,
}: ReverseServiceInvoicePaymentInput): Promise<ReversalResult> {
  const invoice = await prisma.serviceInvoice.findFirst({
    where: {
      OR: [{ id }, { invoiceCode: id }],
      request: { businessId },
    },
    include: {
      request: {
        include: {
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      quotation: {
        select: {
          id: true,
          quotationCode: true,
        },
      },
    },
  });

  if (!invoice) return notFound("Service invoice not found.");
  if (invoice.status === PrismaServiceBusinessInvoiceStatus.CANCELLED) {
    return conflict("Cancelled invoices cannot receive payment reversals.");
  }
  if (invoice.paidAmount <= 0) {
    return conflict("This invoice has no recorded payment to reverse.");
  }

  const reversalAmount = amount == null ? invoice.paidAmount : Math.round(amount);
  if (!Number.isFinite(reversalAmount) || reversalAmount <= 0) {
    return validationError("Payment reversal amount must be greater than zero.");
  }
  if (reversalAmount > invoice.paidAmount) {
    return conflict("Payment reversal amount cannot exceed the current paid amount.");
  }

  const previousPaidAmount = invoice.paidAmount;
  const nextPaidAmount = Math.max(0, previousPaidAmount - reversalAmount);
  const previousInvoiceStatus = invoice.status;
  const nextInvoiceStatus = getInvoiceStatusAfterPaymentReversal(invoice.total, nextPaidAmount);
  const previousWorkflowStatus = invoice.request.status;
  const nextWorkflowStatus = getWorkflowStatusAfterPaymentReversal(nextInvoiceStatus);
  const jobId = invoice.request.jobs[0]?.id ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.serviceInvoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: nextPaidAmount,
        status: nextInvoiceStatus,
        paidAt: nextInvoiceStatus === PrismaServiceBusinessInvoiceStatus.PAID ? invoice.paidAt ?? new Date() : null,
      },
    });

    await tx.serviceRequest.update({
      where: { id: invoice.requestId },
      data: { status: nextWorkflowStatus },
    });

    if (jobId) {
      await tx.serviceJob.update({
        where: { id: jobId },
        data: { status: nextWorkflowStatus },
      });
    }

    await tx.serviceTimelineItem.create({
      data: {
        id: randomUUID(),
        requestId: invoice.requestId,
        label: buildTimelineLabel(`Payment reversed: ${reversalAmount}`, note),
        actorName,
      },
    });
  });

  const job = await findServiceJob(businessId, jobId ?? invoice.requestId);

  return ok("Service invoice payment reversed.", job, {
    type: "invoice-payment-reversal",
    invoiceId: invoice.id,
    invoiceCode: invoice.invoiceCode,
    invoiceTotal: invoice.total,
    reversalAmount,
    previousPaidAmount,
    nextPaidAmount,
    previousInvoiceStatus,
    nextInvoiceStatus,
    previousWorkflowStatus,
    nextWorkflowStatus,
    quotationId: invoice.quotation?.id ?? null,
    quotationCode: invoice.quotation?.quotationCode ?? null,
    note: note ?? null,
  });
}
