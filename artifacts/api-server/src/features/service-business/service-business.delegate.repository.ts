import { prisma } from "../../lib/prisma.js";
import type {
  ServiceBusinessCostCategory,
  ServiceBusinessInvoiceStatus,
  ServiceBusinessJob,
  ServiceBusinessPriority,
  ServiceBusinessQuoteStatus,
  ServiceBusinessWorkflowStatus,
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
 * This intentionally uses generated Prisma delegates instead of raw SQL for the
 * shared dashboard summary path. The heavier CRUD/write repository still uses
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
