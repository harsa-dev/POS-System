import {
  calculateCollectionRate,
  calculateQuoteTotal,
} from "./service-business-workspace-domain";
import type {
  ServiceBusinessJob,
  ServiceBusinessWorkflowStatus,
} from "./service-business-workspace-types";

export type ServiceBusinessTransitionRequirement = {
  id: string;
  label: string;
  isMet: boolean;
  missingReason: string;
};

function requirement(
  id: string,
  label: string,
  isMet: boolean,
  missingReason: string,
): ServiceBusinessTransitionRequirement {
  return {
    id,
    label,
    isMet,
    missingReason,
  };
}

function hasApprovedQuote(job: ServiceBusinessJob) {
  return job.quote.status === "approved" && Boolean(job.quote.customerApprovedAt);
}

function hasInvoiceIssued(job: ServiceBusinessJob) {
  return ["issued", "partial", "paid"].includes(job.invoice.status);
}

function hasFullCollection(job: ServiceBusinessJob) {
  const quoteTotal = calculateQuoteTotal(job);
  return calculateCollectionRate(job.invoice, quoteTotal) >= 100;
}

export function getServiceTransitionRequirements(
  job: ServiceBusinessJob,
  nextStatus: ServiceBusinessWorkflowStatus,
): readonly ServiceBusinessTransitionRequirement[] {
  switch (nextStatus) {
    case "JOB_PLANNING":
      return [
        requirement(
          "has-assignee",
          "A responsible assignee is selected.",
          job.assignedTo.trim().length > 0,
          "Assign a responsible staff or team before planning starts.",
        ),
        requirement(
          "has-scope-summary",
          "Request scope summary exists.",
          job.summary.trim().length > 0,
          "Add service scope notes before turning the request into a job.",
        ),
      ];

    case "QUOTATION_DRAFT":
      return [
        requirement(
          "has-cost-lines",
          "At least one cost line exists.",
          job.costLines.length > 0,
          "Add labor, material, operational, or vendor cost before drafting quotation.",
        ),
        requirement(
          "has-billable-cost",
          "At least one billable cost line exists.",
          job.costLines.some((line) => line.billable),
          "Mark at least one cost line as billable before drafting quotation.",
        ),
      ];

    case "QUOTATION_APPROVED":
      return [
        requirement(
          "quote-is-draft-or-sent",
          "Quotation has been drafted or sent.",
          ["draft", "sent", "approved"].includes(job.quote.status),
          "Create or send a quotation before approval.",
        ),
        requirement(
          "quote-validity-exists",
          "Quotation validity date exists.",
          job.quote.validUntil.trim().length > 0,
          "Set quotation validity before requesting approval.",
        ),
      ];

    case "IN_PROGRESS":
      return [
        requirement(
          "quote-approved",
          "Customer-approved quotation exists.",
          hasApprovedQuote(job),
          "Approve the quotation before starting service work.",
        ),
      ];

    case "READY_FOR_REVIEW":
      return [
        requirement(
          "checklist-exists",
          "Execution checklist exists.",
          job.checklist.length > 0,
          "Prepare checklist items before review.",
        ),
        requirement(
          "active-assignee",
          "Assignee is still available on the job.",
          job.assignedTo.trim().length > 0,
          "Assign the job before marking it ready for review.",
        ),
      ];

    case "DELIVERED":
      return [
        requirement(
          "review-ready",
          "Job is ready for customer review.",
          job.status === "READY_FOR_REVIEW",
          "Move the job to ready for review before delivery confirmation.",
        ),
        requirement(
          "handoff-note-preview",
          "Delivery handoff note is planned.",
          job.timeline.some((item) => item.label.toLowerCase().includes("ready")),
          "Add customer handoff or review timeline before delivery.",
        ),
      ];

    case "INVOICED":
      return [
        requirement(
          "delivered-status",
          "Service has been delivered.",
          job.status === "DELIVERED",
          "Confirm delivery before issuing invoice.",
        ),
        requirement(
          "approved-quote-for-invoice",
          "Approved quote is available for invoice.",
          hasApprovedQuote(job),
          "Invoice should be created from an approved quotation.",
        ),
      ];

    case "PAID":
      return [
        requirement(
          "invoice-issued",
          "Invoice has been issued.",
          hasInvoiceIssued(job),
          "Issue invoice before recording payment.",
        ),
        requirement(
          "payment-started",
          "Paid amount is greater than zero.",
          job.invoice.paidAmount > 0,
          "Record at least one payment before marking invoice as paid.",
        ),
      ];

    case "CLOSED":
      return [
        requirement(
          "full-collection",
          "Invoice collection is complete.",
          hasFullCollection(job) || job.invoice.status === "paid",
          "Collect full payment before closing the service job.",
        ),
      ];

    case "REQUEST_INTAKE":
    default:
      return [];
  }
}

export function countMetTransitionRequirements(
  requirements: readonly ServiceBusinessTransitionRequirement[],
) {
  return requirements.filter((item) => item.isMet).length;
}
