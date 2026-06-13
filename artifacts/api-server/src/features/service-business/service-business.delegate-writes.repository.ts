import { randomUUID } from "node:crypto";

import {
  ServiceBusinessCostCategory as PrismaServiceBusinessCostCategory,
  ServiceBusinessInvoiceStatus as PrismaServiceBusinessInvoiceStatus,
  ServiceBusinessPriority as PrismaServiceBusinessPriority,
  ServiceBusinessQuoteStatus as PrismaServiceBusinessQuoteStatus,
  ServiceBusinessWorkflowStatus as PrismaServiceBusinessWorkflowStatus,
} from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  ServiceBusinessCostCategory,
  ServiceBusinessInvoiceStatus,
  ServiceBusinessPriority,
  ServiceBusinessWorkflowStatus,
  ServiceWorkflowTargetRow,
} from "./service-business.types.js";
import type {
  ServiceInvoiceTarget,
  ServiceQuotationTarget,
  ServiceRequestTarget,
} from "./service-business.crud.repository.js";

function toPrismaPriority(priority: ServiceBusinessPriority) {
  return priority as PrismaServiceBusinessPriority;
}

function toPrismaCostCategory(category: ServiceBusinessCostCategory) {
  return category.toUpperCase() as PrismaServiceBusinessCostCategory;
}

function toPrismaInvoiceStatus(status: ServiceBusinessInvoiceStatus) {
  return status.toUpperCase() as PrismaServiceBusinessInvoiceStatus;
}

function toPrismaWorkflowStatus(status: ServiceBusinessWorkflowStatus) {
  return status as PrismaServiceBusinessWorkflowStatus;
}

function buildWorkflowTimestampUpdate(nextStatus: ServiceBusinessWorkflowStatus) {
  const now = new Date();

  return {
    startedAt: nextStatus === "IN_PROGRESS" ? now : undefined,
    completedAt: nextStatus === "DELIVERED" || nextStatus === "CLOSED" ? now : undefined,
  };
}

export async function createServiceRequestRecordWithDelegate({
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

  await prisma.serviceRequest.create({
    data: {
      id: requestId,
      businessId,
      requestCode,
      customerName,
      customerSegment,
      serviceCategory,
      title,
      summary: summary || null,
      status: PrismaServiceBusinessWorkflowStatus.REQUEST_INTAKE,
      priority: toPrismaPriority(priority),
      dueDate,
      assignedTo,
      jobs: {
        create: {
          id: jobId,
          title,
          assignedTo,
          status: PrismaServiceBusinessWorkflowStatus.REQUEST_INTAKE,
        },
      },
      timeline: {
        create: {
          id: randomUUID(),
          label: "Request received",
          actorName,
        },
      },
    },
  });

  return { requestId, jobId };
}

export async function createServiceCostLineRecordWithDelegate({
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

  await prisma.serviceCostLine.create({
    data: {
      id: randomUUID(),
      jobId: target.jobId,
      label,
      category: toPrismaCostCategory(category),
      quantity,
      unitLabel,
      unitCost: Math.round(unitCost),
      billable,
    },
  });
}

export async function createServiceQuotationRecordWithDelegate({
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
    await tx.serviceQuotation.create({
      data: {
        id: quotationId,
        requestId: target.requestId,
        jobId: target.jobId,
        quotationCode,
        status: PrismaServiceBusinessQuoteStatus.DRAFT,
        subtotal: Math.round(costTotal),
        discountAmount: Math.round(discountAmount),
        taxRate,
        taxAmount: Math.round(taxAmount),
        marginRate: targetMarginRate,
        total: Math.round(total),
        validUntil,
      },
    });

    await tx.serviceRequest.update({
      where: { id: target.requestId },
      data: { status: PrismaServiceBusinessWorkflowStatus.QUOTATION_DRAFT },
    });

    if (target.jobId) {
      await tx.serviceJob.update({
        where: { id: target.jobId },
        data: { status: PrismaServiceBusinessWorkflowStatus.QUOTATION_DRAFT },
      });
    }

    await tx.serviceTimelineItem.create({
      data: {
        id: randomUUID(),
        requestId: target.requestId,
        label: "Quotation drafted",
        actorName,
      },
    });
  });

  return { quotationId, quotationCode };
}

export async function approveServiceQuotationRecordWithDelegate({
  target,
  actorName,
}: {
  target: ServiceQuotationTarget;
  actorName: string;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.serviceQuotation.update({
      where: { id: target.quotationId },
      data: {
        status: PrismaServiceBusinessQuoteStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    await tx.serviceRequest.update({
      where: { id: target.requestId },
      data: { status: PrismaServiceBusinessWorkflowStatus.QUOTATION_APPROVED },
    });

    if (target.jobId) {
      await tx.serviceJob.update({
        where: { id: target.jobId },
        data: { status: PrismaServiceBusinessWorkflowStatus.QUOTATION_APPROVED },
      });
    }

    await tx.serviceTimelineItem.create({
      data: {
        id: randomUUID(),
        requestId: target.requestId,
        label: "Quotation approved",
        actorName,
      },
    });
  });
}

export async function createServiceInvoiceRecordWithDelegate({
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
    await tx.serviceInvoice.create({
      data: {
        id: invoiceId,
        requestId: target.requestId,
        quotationId,
        invoiceCode,
        status: PrismaServiceBusinessInvoiceStatus.ISSUED,
        total: Math.round(total),
        paidAmount: 0,
        dueDate,
        issuedAt: new Date(),
      },
    });

    await tx.serviceRequest.update({
      where: { id: target.requestId },
      data: { status: PrismaServiceBusinessWorkflowStatus.INVOICED },
    });

    if (target.jobId) {
      await tx.serviceJob.update({
        where: { id: target.jobId },
        data: { status: PrismaServiceBusinessWorkflowStatus.INVOICED },
      });
    }

    await tx.serviceTimelineItem.create({
      data: {
        id: randomUUID(),
        requestId: target.requestId,
        label: "Invoice issued",
        actorName,
      },
    });
  });

  return { invoiceId, invoiceCode };
}

export async function recordServiceInvoicePaymentRecordWithDelegate({
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
    await tx.serviceInvoice.update({
      where: { id: target.invoiceId },
      data: {
        paidAmount: nextPaidAmount,
        status: toPrismaInvoiceStatus(nextInvoiceStatus),
        paidAt: nextInvoiceStatus === "paid" ? new Date() : undefined,
      },
    });

    await tx.serviceRequest.update({
      where: { id: target.requestId },
      data: { status: toPrismaWorkflowStatus(nextWorkflowStatus) },
    });

    if (target.jobId) {
      await tx.serviceJob.update({
        where: { id: target.jobId },
        data: { status: toPrismaWorkflowStatus(nextWorkflowStatus) },
      });
    }

    await tx.serviceTimelineItem.create({
      data: {
        id: randomUUID(),
        requestId: target.requestId,
        label: `Payment recorded: ${Math.round(paidAmount)}`,
        actorName,
      },
    });
  });
}

export async function updateServiceWorkflowStatusWithDelegate({
  target,
  nextStatus,
  actorName,
  note,
}: {
  target: ServiceWorkflowTargetRow;
  nextStatus: ServiceBusinessWorkflowStatus;
  actorName: string;
  note?: string;
}) {
  const workflowStatus = toPrismaWorkflowStatus(nextStatus);
  const timelineLabel = note
    ? `Status updated to ${nextStatus}: ${note}`
    : `Status updated to ${nextStatus}`;

  await prisma.$transaction(async (tx) => {
    await tx.serviceRequest.update({
      where: { id: target.requestId },
      data: { status: workflowStatus },
    });

    if (target.jobId) {
      await tx.serviceJob.update({
        where: { id: target.jobId },
        data: {
          status: workflowStatus,
          ...buildWorkflowTimestampUpdate(nextStatus),
        },
      });
    }

    await tx.serviceTimelineItem.create({
      data: {
        id: randomUUID(),
        requestId: target.requestId,
        label: timelineLabel,
        actorName,
      },
    });
  });
}
