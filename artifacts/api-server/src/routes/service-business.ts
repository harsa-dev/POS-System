import { Router } from "express";

import { errorCodes } from "../lib/errors/error-codes.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

type ServiceBusinessWorkflowStatus =
  | "REQUEST_INTAKE"
  | "JOB_PLANNING"
  | "QUOTATION_DRAFT"
  | "QUOTATION_APPROVED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "DELIVERED"
  | "INVOICED"
  | "PAID"
  | "CLOSED";

type ServiceBusinessPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type ServiceBusinessCostCategory = "labor" | "material" | "operational" | "vendor";

type ServiceBusinessCostLine = {
  id: string;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
};

type ServiceBusinessJob = {
  id: string;
  requestCode: string;
  title: string;
  customerName: string;
  customerSegment: string;
  serviceCategory: string;
  status: ServiceBusinessWorkflowStatus;
  priority: ServiceBusinessPriority;
  assignedTo: string;
  dueDate: string;
  summary: string;
  costLines: ServiceBusinessCostLine[];
  checklist: string[];
  quote: {
    id: string;
    code: string;
    status: "draft" | "sent" | "approved" | "rejected" | "expired";
    validUntil: string;
    discountAmount: number;
    taxRate: number;
    targetMarginRate: number;
    customerApprovedAt?: string | null;
  };
  invoice: {
    id: string;
    code: string;
    status: "draft" | "issued" | "partial" | "paid" | "overdue";
    dueDate: string;
    paidAmount: number;
  };
  timeline: Array<{
    label: string;
    at: string;
    actor: string;
  }>;
};

const serviceJobs: ServiceBusinessJob[] = [
  {
    id: "srv-job-001",
    requestCode: "SRV-2026-0001",
    title: "AC maintenance contract for office branch",
    customerName: "PT Sinar Utama",
    customerSegment: "B2B Retainer",
    serviceCategory: "Facility Maintenance",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedTo: "Service Lead",
    dueDate: "2026-06-22",
    summary: "Quarterly AC maintenance package for three office floors with report handoff.",
    costLines: [
      { id: "cost-001", label: "Technician labor", category: "labor", quantity: 12, unitLabel: "hour", unitCost: 125000, billable: true },
      { id: "cost-002", label: "Filter replacement", category: "material", quantity: 18, unitLabel: "unit", unitCost: 45000, billable: true },
      { id: "cost-003", label: "Transport", category: "operational", quantity: 2, unitLabel: "trip", unitCost: 180000, billable: false },
    ],
    checklist: ["Site visit completed", "Customer scope approved", "Technician schedule locked"],
    quote: {
      id: "quote-001",
      code: "QUO-SRV-2026-0001",
      status: "approved",
      validUntil: "2026-06-30",
      discountAmount: 150000,
      taxRate: 0.11,
      targetMarginRate: 0.35,
      customerApprovedAt: "2026-06-10T09:00:00.000Z",
    },
    invoice: {
      id: "invoice-001",
      code: "INV-SRV-2026-0001",
      status: "partial",
      dueDate: "2026-07-05",
      paidAmount: 1250000,
    },
    timeline: [
      { label: "Request received", at: "2026-06-03T08:30:00.000Z", actor: "Front Desk" },
      { label: "Quote approved", at: "2026-06-10T09:00:00.000Z", actor: "Customer" },
      { label: "Work started", at: "2026-06-12T02:00:00.000Z", actor: "Service Lead" },
    ],
  },
  {
    id: "srv-job-002",
    requestCode: "SRV-2026-0002",
    title: "Landing page setup and analytics handoff",
    customerName: "Kopi Tengah Kota",
    customerSegment: "SMB Project",
    serviceCategory: "Digital Service",
    status: "READY_FOR_REVIEW",
    priority: "NORMAL",
    assignedTo: "Implementation Team",
    dueDate: "2026-06-18",
    summary: "Landing page setup, conversion tracking, and admin handoff checklist.",
    costLines: [
      { id: "cost-004", label: "Implementation work", category: "labor", quantity: 20, unitLabel: "hour", unitCost: 150000, billable: true },
      { id: "cost-005", label: "Template license", category: "vendor", quantity: 1, unitLabel: "license", unitCost: 450000, billable: true },
    ],
    checklist: ["Landing page published", "Analytics event checked", "Customer admin trained"],
    quote: {
      id: "quote-002",
      code: "QUO-SRV-2026-0002",
      status: "approved",
      validUntil: "2026-06-25",
      discountAmount: 0,
      taxRate: 0.11,
      targetMarginRate: 0.4,
      customerApprovedAt: "2026-06-07T10:00:00.000Z",
    },
    invoice: {
      id: "invoice-002",
      code: "INV-SRV-2026-0002",
      status: "issued",
      dueDate: "2026-06-30",
      paidAmount: 0,
    },
    timeline: [
      { label: "Request received", at: "2026-06-01T03:10:00.000Z", actor: "Sales" },
      { label: "Ready for review", at: "2026-06-15T08:15:00.000Z", actor: "Implementation Team" },
    ],
  },
  {
    id: "srv-job-003",
    requestCode: "SRV-2026-0003",
    title: "Custom packaging prototype batch",
    customerName: "Rumah Snack Lestari",
    customerSegment: "Prototype Project",
    serviceCategory: "Custom Production",
    status: "QUOTATION_DRAFT",
    priority: "URGENT",
    assignedTo: "Estimator",
    dueDate: "2026-06-16",
    summary: "Prototype packaging run with costing and quotation still being prepared.",
    costLines: [
      { id: "cost-006", label: "Prototype design", category: "labor", quantity: 8, unitLabel: "hour", unitCost: 175000, billable: true },
      { id: "cost-007", label: "Sample material", category: "material", quantity: 40, unitLabel: "sheet", unitCost: 12000, billable: true },
    ],
    checklist: ["Request brief checked", "Material option listed"],
    quote: {
      id: "quote-003",
      code: "QUO-SRV-2026-0003",
      status: "draft",
      validUntil: "2026-06-20",
      discountAmount: 0,
      taxRate: 0.11,
      targetMarginRate: 0.3,
      customerApprovedAt: null,
    },
    invoice: {
      id: "invoice-003",
      code: "INV-SRV-2026-0003",
      status: "draft",
      dueDate: "2026-07-01",
      paidAmount: 0,
    },
    timeline: [
      { label: "Request received", at: "2026-06-12T06:00:00.000Z", actor: "Front Desk" },
      { label: "Draft quote opened", at: "2026-06-13T04:30:00.000Z", actor: "Estimator" },
    ],
  },
];

const statusOrder: ServiceBusinessWorkflowStatus[] = [
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
];

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function isStatus(value: string): value is ServiceBusinessWorkflowStatus {
  return statusOrder.includes(value as ServiceBusinessWorkflowStatus);
}

function isPriority(value: string): value is ServiceBusinessPriority {
  return ["LOW", "NORMAL", "HIGH", "URGENT"].includes(value);
}

function findJob(id: string) {
  return serviceJobs.find((job) => job.id === id || job.requestCode === id);
}

function calculateCostTotal(job: ServiceBusinessJob) {
  return job.costLines.reduce((total, line) => total + line.quantity * line.unitCost, 0);
}

function calculateQuoteTotal(job: ServiceBusinessJob) {
  const costTotal = calculateCostTotal(job);
  const marginBase = Math.round(costTotal / Math.max(1 - job.quote.targetMarginRate, 0.01));
  const afterDiscount = Math.max(marginBase - job.quote.discountAmount, 0);
  return Math.round(afterDiscount + afterDiscount * job.quote.taxRate);
}

function calculateCollectionRate(job: ServiceBusinessJob) {
  const quoteTotal = calculateQuoteTotal(job);
  if (quoteTotal <= 0) return 0;
  return Math.min(job.invoice.paidAmount / quoteTotal, 1);
}

function filterJobs(query: Record<string, unknown>) {
  const search = getText(query.search).toLowerCase();
  const rawStatus = getText(query.status).toUpperCase();
  const rawPriority = getText(query.priority).toUpperCase();
  const assignedTo = getText(query.assignedTo).toLowerCase();
  const serviceCategory = getText(query.serviceCategory).toLowerCase();

  return serviceJobs.filter((job) => {
    const matchesSearch =
      !search ||
      [job.requestCode, job.title, job.customerName, job.customerSegment, job.serviceCategory, job.assignedTo]
        .join(" ")
        .toLowerCase()
        .includes(search);

    const matchesStatus = !rawStatus || rawStatus === "ALL" || job.status === rawStatus;
    const matchesPriority = !rawPriority || rawPriority === "ALL" || job.priority === rawPriority;
    const matchesAssignee = !assignedTo || job.assignedTo.toLowerCase().includes(assignedTo);
    const matchesCategory = !serviceCategory || job.serviceCategory.toLowerCase().includes(serviceCategory);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesCategory;
  });
}

function mutationPreview(message: string, job?: ServiceBusinessJob, extra?: Record<string, unknown>) {
  return {
    success: true,
    dryRun: true,
    message,
    job,
    ...extra,
  };
}

function requireBodyObject(reqBody: unknown) {
  return typeof reqBody === "object" && reqBody !== null ? (reqBody as Record<string, unknown>) : null;
}

router.get("/custom-business/service/workspace", (_req, res) => {
  return successResponse(res, {
    data: {
      jobs: serviceJobs,
      generatedAt: new Date().toISOString(),
      mode: "custom-business-service",
      dryRun: true,
      source: "api-server-mock",
    },
  });
});

router.get("/custom-business/service/jobs", (req, res) => {
  return successResponse(res, {
    data: filterJobs(req.query as Record<string, unknown>),
    meta: {
      dryRun: true,
      source: "api-server-mock",
    },
  });
});

router.post("/custom-business/service/requests", (req, res) => {
  const body = requireBodyObject(req.body);
  if (!body) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "Request payload is required.",
    });
  }

  const title = getText(body.title);
  const customerName = getText(body.customerName);
  const serviceCategory = getText(body.serviceCategory);
  const priority = getText(body.priority).toUpperCase();

  if (!title || !customerName || !serviceCategory || !isPriority(priority)) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "customerName, serviceCategory, title, and valid priority are required.",
    });
  }

  return successResponse(res, {
    status: 202,
    data: mutationPreview("Service request payload accepted for dry-run preview.", undefined, {
      preview: {
        requestCode: `SRV-PREVIEW-${Date.now().toString().slice(-6)}`,
        title,
        customerName,
        serviceCategory,
        priority,
        nextStatus: "REQUEST_INTAKE",
      },
    }),
  });
});

router.patch("/custom-business/service/jobs/:id/status", (req, res) => {
  const body = requireBodyObject(req.body);
  const job = findJob(req.params.id);

  if (!job) {
    return errorResponse(res, {
      status: 404,
      code: errorCodes.notFound,
      message: "Service job not found.",
    });
  }

  const nextStatus = getText(body?.nextStatus).toUpperCase();
  if (!isStatus(nextStatus)) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "nextStatus is required and must be a valid service status.",
    });
  }

  return successResponse(res, {
    data: mutationPreview(`Status change preview: ${job.status} -> ${nextStatus}.`, job, {
      preview: { jobId: job.id, currentStatus: job.status, nextStatus, note: getText(body?.note) || null },
    }),
  });
});

router.post("/custom-business/service/jobs/:id/cost-lines", (req, res) => {
  const body = requireBodyObject(req.body);
  const job = findJob(req.params.id);

  if (!job) {
    return errorResponse(res, {
      status: 404,
      code: errorCodes.notFound,
      message: "Service job not found.",
    });
  }

  const label = getText(body?.label);
  const category = getText(body?.category).toLowerCase();
  const quantity = getFiniteNumber(body?.quantity);
  const unitCost = getFiniteNumber(body?.unitCost);
  const unitLabel = getText(body?.unitLabel) || "unit";

  if (!label || !["labor", "material", "operational", "vendor"].includes(category) || quantity === null || quantity <= 0 || unitCost === null || unitCost < 0) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "label, category, quantity, unitLabel, and unitCost are required for cost line preview.",
    });
  }

  return successResponse(res, {
    status: 202,
    data: mutationPreview("Cost line accepted for dry-run preview.", job, {
      preview: {
        id: `cost-preview-${Date.now().toString().slice(-6)}`,
        label,
        category,
        quantity,
        unitLabel,
        unitCost,
        billable: Boolean(body?.billable),
      },
    }),
  });
});

router.post("/custom-business/service/quotations", (req, res) => {
  const body = requireBodyObject(req.body);
  const requestId = getText(body?.requestId);
  const job = findJob(requestId);

  if (!job) {
    return errorResponse(res, {
      status: 404,
      code: errorCodes.notFound,
      message: "Service request/job not found for quotation preview.",
    });
  }

  return successResponse(res, {
    status: 202,
    data: mutationPreview("Quotation payload accepted for dry-run preview.", job, {
      preview: {
        requestId: job.id,
        discountAmount: getFiniteNumber(body?.discountAmount) ?? job.quote.discountAmount,
        taxRate: getFiniteNumber(body?.taxRate) ?? job.quote.taxRate,
        targetMarginRate: getFiniteNumber(body?.targetMarginRate) ?? job.quote.targetMarginRate,
        validUntil: getText(body?.validUntil) || job.quote.validUntil,
      },
    }),
  });
});

router.patch("/custom-business/service/quotations/:id/approve", (req, res) => {
  const job = serviceJobs.find((item) => item.quote.id === req.params.id || item.quote.code === req.params.id);
  const body = requireBodyObject(req.body);

  if (!job) {
    return errorResponse(res, {
      status: 404,
      code: errorCodes.notFound,
      message: "Service quotation not found.",
    });
  }

  return successResponse(res, {
    data: mutationPreview("Quotation approval accepted for dry-run preview.", job, {
      preview: {
        quotationId: job.quote.id,
        approvedBy: getText(body?.approvedBy) || "Preview approver",
        approvedAt: getText(body?.approvedAt) || new Date().toISOString(),
        note: getText(body?.note) || null,
      },
    }),
  });
});

router.post("/custom-business/service/invoices", (req, res) => {
  const body = requireBodyObject(req.body);
  const job = findJob(getText(body?.requestId));

  if (!job) {
    return errorResponse(res, {
      status: 404,
      code: errorCodes.notFound,
      message: "Service request/job not found for invoice preview.",
    });
  }

  return successResponse(res, {
    status: 202,
    data: mutationPreview("Invoice payload accepted for dry-run preview.", job, {
      preview: {
        requestId: job.id,
        quotationId: getText(body?.quotationId) || job.quote.id,
        dueDate: getText(body?.dueDate) || job.invoice.dueDate,
        paymentTermDays: getFiniteNumber(body?.paymentTermDays) ?? 14,
        quoteTotal: calculateQuoteTotal(job),
      },
    }),
  });
});

router.patch("/custom-business/service/invoices/:id/payment", (req, res) => {
  const body = requireBodyObject(req.body);
  const job = serviceJobs.find((item) => item.invoice.id === req.params.id || item.invoice.code === req.params.id);
  const paidAmount = getFiniteNumber(body?.paidAmount);

  if (!job) {
    return errorResponse(res, {
      status: 404,
      code: errorCodes.notFound,
      message: "Service invoice not found.",
    });
  }

  if (paidAmount === null || paidAmount <= 0) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "paidAmount must be greater than 0.",
    });
  }

  return successResponse(res, {
    data: mutationPreview("Invoice payment accepted for dry-run preview.", job, {
      preview: {
        invoiceId: job.invoice.id,
        paidAmount,
        paymentMethod: getText(body?.paymentMethod) || "other",
        paidAt: getText(body?.paidAt) || new Date().toISOString(),
        note: getText(body?.note) || null,
        projectedCollectionRate: Math.min((job.invoice.paidAmount + paidAmount) / calculateQuoteTotal(job), 1),
        currentCollectionRate: calculateCollectionRate(job),
      },
    }),
  });
});

export default router;
