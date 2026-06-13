import {
  calculateServiceCostTotal,
  calculateServiceQuoteTotalFromCost,
} from "./service-business.crud.service.js";
import { loadServiceBusinessSummaryJobs } from "./service-business.delegate.repository.js";
import {
  serviceBusinessInvoiceStatuses,
  serviceBusinessWorkflowStatuses,
  type ServiceBusinessInvoiceStatus,
  type ServiceBusinessJob,
  type ServiceBusinessWorkflowStatus,
} from "./service-business.types.js";

const inactiveStatuses = new Set<ServiceBusinessWorkflowStatus>(["CLOSED", "CANCELLED", "REJECTED"]);
const priorityStatuses = new Set(["HIGH", "URGENT"]);
const invoiceCountStatuses = new Set<ServiceBusinessInvoiceStatus>(["issued", "partial", "paid", "overdue"]);

function createWorkflowDistribution() {
  return serviceBusinessWorkflowStatuses.reduce<Record<ServiceBusinessWorkflowStatus, number>>(
    (result, status) => {
      result[status] = 0;
      return result;
    },
    {} as Record<ServiceBusinessWorkflowStatus, number>,
  );
}

function createInvoiceDistribution() {
  return serviceBusinessInvoiceStatuses.reduce<Record<ServiceBusinessInvoiceStatus, number>>(
    (result, status) => {
      result[status] = 0;
      return result;
    },
    {} as Record<ServiceBusinessInvoiceStatus, number>,
  );
}

function calculateQuoteTotal(job: ServiceBusinessJob) {
  return calculateServiceQuoteTotalFromCost({
    costTotal: calculateServiceCostTotal(job.costLines),
    discountAmount: job.quote.discountAmount,
    taxRate: job.quote.taxRate,
    targetMarginRate: job.quote.targetMarginRate,
  });
}

function formatStatusLabel(status: ServiceBusinessWorkflowStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export async function getServiceBusinessDashboardSummary(businessId: string) {
  const jobs = await loadServiceBusinessSummaryJobs(businessId);
  const workflowDistribution = createWorkflowDistribution();
  const invoiceDistribution = createInvoiceDistribution();

  const summary = jobs.reduce(
    (result, job) => {
      const quoteTotal = calculateQuoteTotal(job);
      const paidAmount = Math.max(job.invoice.paidAmount, 0);
      const pendingCollection = Math.max(quoteTotal - paidAmount, 0);
      const hasIssuedInvoice = invoiceCountStatuses.has(job.invoice.status);

      workflowDistribution[job.status] += 1;
      invoiceDistribution[job.invoice.status] += 1;

      result.totalJobs += 1;
      if (!inactiveStatuses.has(job.status)) result.activeJobs += 1;
      if (priorityStatuses.has(job.priority)) result.highPriorityJobs += 1;
      if (job.quote.status === "approved") result.approvedQuotes += 1;
      if (hasIssuedInvoice) result.issuedInvoices += 1;
      result.quoteTotal += quoteTotal;
      result.invoiceTotal += hasIssuedInvoice ? quoteTotal : 0;
      result.pendingCollection += pendingCollection;
      result.paidAmount += paidAmount;

      return result;
    },
    {
      totalJobs: 0,
      activeJobs: 0,
      highPriorityJobs: 0,
      approvedQuotes: 0,
      issuedInvoices: 0,
      quoteTotal: 0,
      invoiceTotal: 0,
      pendingCollection: 0,
      paidAmount: 0,
    },
  );

  const latestJob = jobs[0] ?? null;
  const averageCollectionRate = summary.totalJobs
    ? Math.round(
        jobs.reduce((total, job) => {
          const quoteTotal = calculateQuoteTotal(job);
          if (quoteTotal <= 0) return total;
          return total + Math.min(job.invoice.paidAmount / quoteTotal, 1);
        }, 0) / summary.totalJobs * 100,
      )
    : 0;
  const overallCollectionRate = summary.invoiceTotal > 0
    ? Math.round(Math.min(summary.paidAmount / summary.invoiceTotal, 1) * 100)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    source: "api-server-prisma-delegate-summary" as const,
    totals: {
      jobs: summary.totalJobs,
      activeJobs: summary.activeJobs,
      highPriorityJobs: summary.highPriorityJobs,
      approvedQuotes: summary.approvedQuotes,
      issuedInvoices: summary.issuedInvoices,
    },
    money: {
      quoteTotal: Math.round(summary.quoteTotal),
      invoiceTotal: Math.round(summary.invoiceTotal),
      pendingCollection: Math.round(summary.pendingCollection),
      paidAmount: Math.round(summary.paidAmount),
    },
    collection: {
      averageRate: averageCollectionRate,
      overallRate: overallCollectionRate,
    },
    workflowDistribution,
    invoiceDistribution,
    latestJob: latestJob
      ? {
          id: latestJob.id,
          requestCode: latestJob.requestCode,
          title: latestJob.title,
          customerName: latestJob.customerName,
          status: latestJob.status,
          statusLabel: formatStatusLabel(latestJob.status),
        }
      : null,
  };
}
