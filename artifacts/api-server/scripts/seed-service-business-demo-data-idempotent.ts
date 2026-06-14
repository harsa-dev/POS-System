import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadEnvFile();

const { prisma } = await import("../src/lib/prisma.js");

function scopedId(businessId: string, seedId: string) {
  return `service-${businessId}-${seedId}`;
}

const requests = [
  {
    id: "hvac-maintenance-001",
    requestCode: "SRV-DEMO-HVAC-001",
    customerName: "Aruna Office Tower",
    customerSegment: "Commercial Facility",
    serviceCategory: "HVAC Maintenance",
    title: "Quarterly HVAC maintenance for office tower",
    summary:
      "Demo service request for preventive HVAC maintenance, filter replacement, and inspection report delivery.",
    status: "IN_PROGRESS" as const,
    priority: "HIGH" as const,
    dueDate: new Date("2026-06-25T10:00:00.000Z"),
    assignedTo: "Field Team A",
  },
  {
    id: "website-support-001",
    requestCode: "SRV-DEMO-WEB-001",
    customerName: "Kopi Senja Digital",
    customerSegment: "SMB Retainer",
    serviceCategory: "Website Support",
    title: "Landing page refresh and checkout bug triage",
    summary:
      "Demo service request for digital service retainer work, quotation approval, and staged delivery.",
    status: "QUOTATION_APPROVED" as const,
    priority: "NORMAL" as const,
    dueDate: new Date("2026-06-22T15:00:00.000Z"),
    assignedTo: "Service Desk",
  },
  {
    id: "equipment-calibration-001",
    requestCode: "SRV-DEMO-CAL-001",
    customerName: "Prima Lab Instruments",
    customerSegment: "Enterprise Account",
    serviceCategory: "Equipment Calibration",
    title: "Calibration intake for weighing instruments",
    summary:
      "Demo intake-stage request for calibration service, still waiting for planning and quotation.",
    status: "REQUEST_INTAKE" as const,
    priority: "URGENT" as const,
    dueDate: new Date("2026-06-18T09:00:00.000Z"),
    assignedTo: "Intake Coordinator",
  },
];

const jobs = [
  {
    id: "hvac-maintenance-job-001",
    requestId: "hvac-maintenance-001",
    title: "On-site HVAC inspection and filter replacement",
    assignedTo: "Raka Field Lead",
    status: "IN_PROGRESS" as const,
    startedAt: new Date("2026-06-14T02:00:00.000Z"),
    completedAt: null,
  },
  {
    id: "website-support-job-001",
    requestId: "website-support-001",
    title: "Website QA, content refresh, and checkout fix",
    assignedTo: "Mira Product Ops",
    status: "QUOTATION_APPROVED" as const,
    startedAt: null,
    completedAt: null,
  },
  {
    id: "equipment-calibration-job-001",
    requestId: "equipment-calibration-001",
    title: "Calibration intake validation and job planning",
    assignedTo: "Dimas Calibration Tech",
    status: "REQUEST_INTAKE" as const,
    startedAt: null,
    completedAt: null,
  },
];

const costLines = [
  {
    id: "hvac-labor-001",
    jobId: "hvac-maintenance-job-001",
    label: "Senior technician labor",
    category: "LABOR" as const,
    quantity: 6,
    unitLabel: "hour",
    unitCost: 175_000,
    billable: true,
  },
  {
    id: "hvac-filter-material-001",
    jobId: "hvac-maintenance-job-001",
    label: "HVAC filter replacement set",
    category: "MATERIAL" as const,
    quantity: 8,
    unitLabel: "pcs",
    unitCost: 85_000,
    billable: true,
  },
  {
    id: "hvac-transport-001",
    jobId: "hvac-maintenance-job-001",
    label: "Field transport and parking",
    category: "OPERATIONAL" as const,
    quantity: 1,
    unitLabel: "trip",
    unitCost: 220_000,
    billable: true,
  },
  {
    id: "web-design-labor-001",
    jobId: "website-support-job-001",
    label: "UI copy and landing refresh",
    category: "LABOR" as const,
    quantity: 10,
    unitLabel: "hour",
    unitCost: 150_000,
    billable: true,
  },
  {
    id: "web-qa-labor-001",
    jobId: "website-support-job-001",
    label: "Checkout issue QA and regression test",
    category: "LABOR" as const,
    quantity: 6,
    unitLabel: "hour",
    unitCost: 160_000,
    billable: true,
  },
  {
    id: "calibration-vendor-001",
    jobId: "equipment-calibration-job-001",
    label: "External certification partner estimate",
    category: "VENDOR" as const,
    quantity: 1,
    unitLabel: "service",
    unitCost: 950_000,
    billable: true,
  },
];

const quotations = [
  {
    id: "hvac-quote-001",
    requestId: "hvac-maintenance-001",
    jobId: "hvac-maintenance-job-001",
    quotationCode: "SQ-DEMO-HVAC-001",
    status: "APPROVED" as const,
    subtotal: 1_950_000,
    discountAmount: 100_000,
    taxRate: 0.11,
    taxAmount: 203_500,
    marginRate: 0.18,
    total: 2_053_500,
    validUntil: new Date("2026-06-24T00:00:00.000Z"),
    approvedAt: new Date("2026-06-12T03:30:00.000Z"),
  },
  {
    id: "web-quote-001",
    requestId: "website-support-001",
    jobId: "website-support-job-001",
    quotationCode: "SQ-DEMO-WEB-001",
    status: "APPROVED" as const,
    subtotal: 2_460_000,
    discountAmount: 0,
    taxRate: 0.11,
    taxAmount: 270_600,
    marginRate: 0.22,
    total: 2_730_600,
    validUntil: new Date("2026-06-30T00:00:00.000Z"),
    approvedAt: new Date("2026-06-13T05:00:00.000Z"),
  },
  {
    id: "calibration-quote-001",
    requestId: "equipment-calibration-001",
    jobId: "equipment-calibration-job-001",
    quotationCode: "SQ-DEMO-CAL-001",
    status: "DRAFT" as const,
    subtotal: 950_000,
    discountAmount: 0,
    taxRate: 0.11,
    taxAmount: 104_500,
    marginRate: 0.2,
    total: 1_054_500,
    validUntil: new Date("2026-06-20T00:00:00.000Z"),
    approvedAt: null,
  },
];

const invoices = [
  {
    id: "hvac-invoice-001",
    requestId: "hvac-maintenance-001",
    quotationId: "hvac-quote-001",
    invoiceCode: "SI-DEMO-HVAC-001",
    status: "PARTIAL" as const,
    total: 2_053_500,
    paidAmount: 1_000_000,
    dueDate: new Date("2026-07-05T00:00:00.000Z"),
    issuedAt: new Date("2026-06-14T06:00:00.000Z"),
    paidAt: null,
  },
  {
    id: "web-invoice-001",
    requestId: "website-support-001",
    quotationId: "web-quote-001",
    invoiceCode: "SI-DEMO-WEB-001",
    status: "PAID" as const,
    total: 2_730_600,
    paidAmount: 2_730_600,
    dueDate: new Date("2026-07-10T00:00:00.000Z"),
    issuedAt: new Date("2026-06-13T08:00:00.000Z"),
    paidAt: new Date("2026-06-13T09:30:00.000Z"),
  },
];

const checklistItems = [
  {
    id: "hvac-checklist-001",
    jobId: "hvac-maintenance-job-001",
    label: "Inspect outdoor condenser unit",
    isDone: true,
    completedAt: new Date("2026-06-14T03:10:00.000Z"),
  },
  {
    id: "hvac-checklist-002",
    jobId: "hvac-maintenance-job-001",
    label: "Replace filter set",
    isDone: true,
    completedAt: new Date("2026-06-14T04:20:00.000Z"),
  },
  {
    id: "hvac-checklist-003",
    jobId: "hvac-maintenance-job-001",
    label: "Upload service report for customer review",
    isDone: false,
    completedAt: null,
  },
  {
    id: "web-checklist-001",
    jobId: "website-support-job-001",
    label: "Confirm checkout reproduction steps",
    isDone: true,
    completedAt: new Date("2026-06-13T06:00:00.000Z"),
  },
  {
    id: "web-checklist-002",
    jobId: "website-support-job-001",
    label: "Prepare deployment checklist",
    isDone: false,
    completedAt: null,
  },
  {
    id: "calibration-checklist-001",
    jobId: "equipment-calibration-job-001",
    label: "Validate serial numbers and intake photos",
    isDone: false,
    completedAt: null,
  },
];

const timelineItems = [
  {
    id: "hvac-timeline-001",
    requestId: "hvac-maintenance-001",
    label: "Request accepted and assigned to Field Team A.",
    actorName: "System Seed",
    occurredAt: new Date("2026-06-11T02:00:00.000Z"),
  },
  {
    id: "hvac-timeline-002",
    requestId: "hvac-maintenance-001",
    label: "Quotation approved by facility manager.",
    actorName: "System Seed",
    occurredAt: new Date("2026-06-12T03:30:00.000Z"),
  },
  {
    id: "hvac-timeline-003",
    requestId: "hvac-maintenance-001",
    label: "Partial payment received after invoice issue.",
    actorName: "System Seed",
    occurredAt: new Date("2026-06-14T07:00:00.000Z"),
  },
  {
    id: "web-timeline-001",
    requestId: "website-support-001",
    label: "Quote approved and paid before execution window.",
    actorName: "System Seed",
    occurredAt: new Date("2026-06-13T09:30:00.000Z"),
  },
  {
    id: "calibration-timeline-001",
    requestId: "equipment-calibration-001",
    label: "Urgent calibration request entered intake queue.",
    actorName: "System Seed",
    occurredAt: new Date("2026-06-14T01:15:00.000Z"),
  },
];

async function seedServiceBusinessDemoData() {
  const business = await prisma.business.findFirst({
    where: {
      mode: "SERVICE",
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!business) {
    console.log("No active SERVICE business found. Skipping Service Business demo seed.");
    console.log("Run: pnpm --filter @workspace/api-server run service:ensure-business");
    return;
  }

  for (const request of requests) {
    await prisma.serviceRequest.upsert({
      where: {
        id: scopedId(business.id, request.id),
      },
      create: {
        id: scopedId(business.id, request.id),
        businessId: business.id,
        requestCode: request.requestCode,
        customerName: request.customerName,
        customerSegment: request.customerSegment,
        serviceCategory: request.serviceCategory,
        title: request.title,
        summary: request.summary,
        status: request.status,
        priority: request.priority,
        dueDate: request.dueDate,
        assignedTo: request.assignedTo,
      },
      update: {
        customerName: request.customerName,
        customerSegment: request.customerSegment,
        serviceCategory: request.serviceCategory,
        title: request.title,
        summary: request.summary,
        status: request.status,
        priority: request.priority,
        dueDate: request.dueDate,
        assignedTo: request.assignedTo,
      },
    });
  }

  for (const job of jobs) {
    await prisma.serviceJob.upsert({
      where: {
        id: scopedId(business.id, job.id),
      },
      create: {
        id: scopedId(business.id, job.id),
        requestId: scopedId(business.id, job.requestId),
        title: job.title,
        assignedTo: job.assignedTo,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
      update: {
        title: job.title,
        assignedTo: job.assignedTo,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  }

  for (const line of costLines) {
    await prisma.serviceCostLine.upsert({
      where: {
        id: scopedId(business.id, line.id),
      },
      create: {
        id: scopedId(business.id, line.id),
        jobId: scopedId(business.id, line.jobId),
        label: line.label,
        category: line.category,
        quantity: line.quantity,
        unitLabel: line.unitLabel,
        unitCost: line.unitCost,
        billable: line.billable,
      },
      update: {
        label: line.label,
        category: line.category,
        quantity: line.quantity,
        unitLabel: line.unitLabel,
        unitCost: line.unitCost,
        billable: line.billable,
      },
    });
  }

  for (const quote of quotations) {
    await prisma.serviceQuotation.upsert({
      where: {
        id: scopedId(business.id, quote.id),
      },
      create: {
        id: scopedId(business.id, quote.id),
        requestId: scopedId(business.id, quote.requestId),
        jobId: scopedId(business.id, quote.jobId),
        quotationCode: quote.quotationCode,
        status: quote.status,
        subtotal: quote.subtotal,
        discountAmount: quote.discountAmount,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        marginRate: quote.marginRate,
        total: quote.total,
        validUntil: quote.validUntil,
        approvedAt: quote.approvedAt,
      },
      update: {
        jobId: scopedId(business.id, quote.jobId),
        status: quote.status,
        subtotal: quote.subtotal,
        discountAmount: quote.discountAmount,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        marginRate: quote.marginRate,
        total: quote.total,
        validUntil: quote.validUntil,
        approvedAt: quote.approvedAt,
      },
    });
  }

  for (const invoice of invoices) {
    await prisma.serviceInvoice.upsert({
      where: {
        id: scopedId(business.id, invoice.id),
      },
      create: {
        id: scopedId(business.id, invoice.id),
        requestId: scopedId(business.id, invoice.requestId),
        quotationId: invoice.quotationId ? scopedId(business.id, invoice.quotationId) : null,
        invoiceCode: invoice.invoiceCode,
        status: invoice.status,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        dueDate: invoice.dueDate,
        issuedAt: invoice.issuedAt,
        paidAt: invoice.paidAt,
      },
      update: {
        quotationId: invoice.quotationId ? scopedId(business.id, invoice.quotationId) : null,
        status: invoice.status,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        dueDate: invoice.dueDate,
        issuedAt: invoice.issuedAt,
        paidAt: invoice.paidAt,
      },
    });
  }

  for (const item of checklistItems) {
    await prisma.serviceChecklistItem.upsert({
      where: {
        id: scopedId(business.id, item.id),
      },
      create: {
        id: scopedId(business.id, item.id),
        jobId: scopedId(business.id, item.jobId),
        label: item.label,
        isDone: item.isDone,
        completedAt: item.completedAt,
      },
      update: {
        label: item.label,
        isDone: item.isDone,
        completedAt: item.completedAt,
      },
    });
  }

  for (const timeline of timelineItems) {
    await prisma.serviceTimelineItem.upsert({
      where: {
        id: scopedId(business.id, timeline.id),
      },
      create: {
        id: scopedId(business.id, timeline.id),
        requestId: scopedId(business.id, timeline.requestId),
        label: timeline.label,
        actorName: timeline.actorName,
        occurredAt: timeline.occurredAt,
      },
      update: {
        label: timeline.label,
        actorName: timeline.actorName,
        occurredAt: timeline.occurredAt,
      },
    });
  }

  console.log(`Seeded Service Business demo data for ${business.name} (${business.id}).`);
  console.log(
    "Inserted/updated: 3 requests, 3 jobs, 6 cost lines, 3 quotes, 2 invoices, 6 checklist items, 5 timeline items.",
  );
}

try {
  await seedServiceBusinessDemoData();
} finally {
  await prisma.$disconnect();
}
