import { prisma } from "../../lib/prisma.js";
import { loadServiceBusinessSummaryJobs } from "./service-business.delegate.repository.js";
import {
  approveServiceQuotationRecordWithDelegate,
  createServiceCostLineRecordWithDelegate,
  createServiceInvoiceRecordWithDelegate,
  createServiceQuotationRecordWithDelegate,
  createServiceRequestRecordWithDelegate,
  recordServiceInvoicePaymentRecordWithDelegate,
} from "./service-business.delegate-writes.repository.js";
import type {
  ServiceBusinessCostCategory,
  ServiceBusinessInvoiceStatus,
  ServiceBusinessJob,
  ServiceBusinessPriority,
  ServiceBusinessWorkflowStatus,
} from "./service-business.types.js";

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

export async function getServiceRequestNextSequence(businessId: string) {
  const count = await prisma.serviceRequest.count({
    where: {
      businessId,
    },
  });

  return count + 1;
}

export async function loadServiceJobs(businessId: string) {
  return loadServiceBusinessSummaryJobs(businessId);
}

export async function findServiceJob(businessId: string, id: string) {
  const jobs = await loadServiceJobs(businessId);
  return (
    jobs.find(
      (job) =>
        job.id === id ||
        job.requestCode === id ||
        job.quote.id === id ||
        job.quote.code === id ||
        job.invoice.id === id ||
        job.invoice.code === id,
    ) ?? null
  );
}

export async function findServiceRequestTarget(businessId: string, id: string): Promise<ServiceRequestTarget | null> {
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

  if (!request) return null;

  return {
    requestId: request.id,
    jobId: request.jobs[0]?.id ?? null,
  };
}

export async function findServiceQuotationTarget(
  businessId: string,
  id: string,
): Promise<ServiceQuotationTarget | null> {
  const quotation = await prisma.serviceQuotation.findFirst({
    where: {
      OR: [{ id }, { quotationCode: id }],
      request: {
        businessId,
      },
    },
    select: {
      id: true,
      requestId: true,
      jobId: true,
    },
  });

  if (!quotation) return null;

  return {
    quotationId: quotation.id,
    requestId: quotation.requestId,
    jobId: quotation.jobId,
  };
}

export async function findServiceInvoiceTarget(businessId: string, id: string): Promise<ServiceInvoiceTarget | null> {
  const invoice = await prisma.serviceInvoice.findFirst({
    where: {
      OR: [{ id }, { invoiceCode: id }],
      request: {
        businessId,
      },
    },
    include: {
      request: {
        include: {
          jobs: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!invoice) return null;

  return {
    invoiceId: invoice.id,
    requestId: invoice.requestId,
    jobId: invoice.request.jobs[0]?.id ?? null,
    invoiceTotal: invoice.total,
    currentPaidAmount: invoice.paidAmount,
  };
}

export async function createServiceRequestRecord(args: {
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
  return createServiceRequestRecordWithDelegate(args);
}

export async function createServiceCostLineRecord(args: {
  target: ServiceRequestTarget;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
}) {
  return createServiceCostLineRecordWithDelegate(args);
}

export async function createServiceQuotationRecord(args: {
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
  return createServiceQuotationRecordWithDelegate(args);
}

export async function approveServiceQuotationRecord(args: {
  target: ServiceQuotationTarget;
  actorName: string;
}) {
  return approveServiceQuotationRecordWithDelegate(args);
}

export async function createServiceInvoiceRecord(args: {
  target: ServiceRequestTarget;
  quotationId: string | null;
  total: number;
  dueDate: Date | null;
  actorName: string;
}) {
  return createServiceInvoiceRecordWithDelegate(args);
}

export async function recordServiceInvoicePaymentRecord(args: {
  target: ServiceInvoiceTarget;
  paidAmount: number;
  nextPaidAmount: number;
  nextInvoiceStatus: ServiceBusinessInvoiceStatus;
  nextWorkflowStatus: ServiceBusinessWorkflowStatus;
  actorName: string;
}) {
  return recordServiceInvoicePaymentRecordWithDelegate(args);
}

export type { ServiceBusinessJob };
