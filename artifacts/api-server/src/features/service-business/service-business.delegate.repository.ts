import { prisma } from "../../lib/prisma.js";
import type {
  ServiceBusinessCostCategory,
  ServiceBusinessInvoiceStatus,
  ServiceBusinessJob,
  ServiceBusinessPriority,
  ServiceBusinessQuoteStatus,
  ServiceBusinessWorkflowStatus,
  ServiceWorkflowReadinessRow,
  ServiceWorkflowTargetRow,
} from "./service-business.types.js";

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function toWorkflowStatus(value: unknown): ServiceBusinessWorkflowStatus {
  return String(value) as ServiceBusinessWorkflowStatus;
}

function toPriority(value: unknown): ServiceBusinessPriority {
  return String(value) as ServiceBusinessPriority;
}

function toCostCategory(value: unknown): ServiceBusinessCostCategory {
  return String(value).toLowerCase() as ServiceBusinessCostCategory;
}

function toQuoteStatus(value: unknown): ServiceBusinessQuoteStatus {
  return String(value).toLowerCase() as ServiceBusinessQuoteStatus;
}

function toInvoiceStatus(value: unknown): ServiceBusinessInvoiceStatus {
  return String(value).toLowerCase() as ServiceBusinessInvoiceStatus;
}

/**
 * Phase 7B read-side repository.
 *
 * This intentionally uses generated Prisma delegates instead of raw SQL for
 * summary and workflow read paths. The heavier CRUD/write repository still uses
 * explicit SQL until each mutation can be moved behind transactions safely.
 */
export async function loadServiceBusinessSummaryJobs(businessId: string): Promise<ServiceBusinessJob[]> {
  const requests = await prisma.serviceRequest.findMany({
    where: {
      businessId,
    },
    include: {
      jobs: {
        include: {
          costLines: true,
          checklistItems: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      quotes: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      invoices: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      timeline: {
        orderBy: {
          occurredAt: "desc",
        },
        take: 5,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map((request): ServiceBusinessJob => {
    const job = request.jobs[0] ?? null;
    const quote = request.quotes[0] ?? null;
    const invoice = request.invoices[0] ?? null;

    return {
      id: job?.id ?? request.id,
      requestCode: request.requestCode,
      title: job?.title ?? request.title,
      customerName: request.customerName,
      customerSegment: request.customerSegment,
      serviceCategory: request.serviceCategory,
      status: toWorkflowStatus(job?.status ?? request.status),
      priority: toPriority(request.priority),
      assignedTo: job?.assignedTo ?? request.assignedTo ?? "Unassigned",
      dueDate: toIsoDate(request.dueDate),
      summary: request.summary ?? "",
      costLines: (job?.costLines ?? []).map((line) => ({
        id: line.id,
        label: line.label,
        category: toCostCategory(line.category),
        quantity: line.quantity,
        unitLabel: line.unitLabel,
        unitCost: line.unitCost,
        billable: line.billable,
      })),
      checklist: (job?.checklistItems ?? []).map((item) => item.label),
      quote: {
        id: quote?.id ?? "",
        code: quote?.quotationCode ?? "",
        status: toQuoteStatus(quote?.status ?? "draft"),
        validUntil: toIsoDate(quote?.validUntil),
        discountAmount: quote?.discountAmount ?? 0,
        taxRate: quote?.taxRate ?? 0,
        targetMarginRate: quote?.marginRate ?? 0,
        customerApprovedAt: toIsoDate(quote?.approvedAt) || null,
      },
      invoice: {
        id: invoice?.id ?? "",
        code: invoice?.invoiceCode ?? "",
        status: toInvoiceStatus(invoice?.status ?? "draft"),
        dueDate: toIsoDate(invoice?.dueDate),
        paidAmount: invoice?.paidAmount ?? 0,
      },
      timeline: request.timeline.map((item) => ({
        label: item.label,
        at: item.occurredAt.toISOString(),
        actor: item.actorName,
      })),
    };
  });
}

export async function findServiceWorkflowTargetWithDelegate(
  businessId: string,
  id: string,
): Promise<ServiceWorkflowTargetRow | null> {
  const request = await prisma.serviceRequest.findFirst({
    where: {
      businessId,
      OR: [
        { id },
        { requestCode: id },
        {
          jobs: {
            some: {
              id,
            },
          },
        },
      ],
    },
    include: {
      jobs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!request) {
    return null;
  }

  const job = request.jobs[0] ?? null;

  return {
    requestId: request.id,
    requestCode: request.requestCode,
    jobId: job?.id ?? null,
    currentStatus: toWorkflowStatus(job?.status ?? request.status),
    summary: request.summary,
  };
}

export async function loadServiceWorkflowReadinessWithDelegate(
  target: ServiceWorkflowTargetRow,
): Promise<ServiceWorkflowReadinessRow> {
  const costLineCount = target.jobId
    ? await prisma.serviceCostLine.count({
        where: {
          jobId: target.jobId,
        },
      })
    : 0;

  const billableCostCount = target.jobId
    ? await prisma.serviceCostLine.count({
        where: {
          jobId: target.jobId,
          billable: true,
          quantity: {
            gt: 0,
          },
          unitCost: {
            gt: 0,
          },
        },
      })
    : 0;

  const quotationCount = await prisma.serviceQuotation.count({
    where: {
      requestId: target.requestId,
    },
  });

  const approvedQuotationCount = await prisma.serviceQuotation.count({
    where: {
      requestId: target.requestId,
      status: "APPROVED",
    },
  });

  const invoiceCount = await prisma.serviceInvoice.count({
    where: {
      requestId: target.requestId,
    },
  });

  const paidInvoiceCount = await prisma.serviceInvoice.count({
    where: {
      requestId: target.requestId,
      status: "PAID",
    },
  });

  const checklistCount = target.jobId
    ? await prisma.serviceChecklistItem.count({
        where: {
          jobId: target.jobId,
        },
      })
    : 0;

  return {
    hasSummary: Boolean(target.summary?.trim()),
    hasCostLines: costLineCount > 0,
    hasBillableCost: billableCostCount > 0,
    hasQuotation: quotationCount > 0,
    hasApprovedQuotation: approvedQuotationCount > 0,
    hasInvoice: invoiceCount > 0,
    hasPaidInvoice: paidInvoiceCount > 0,
    checklistCount,
  };
}
