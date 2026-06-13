import type {
  ServiceBusinessConfigDraft,
  ServiceBusinessJob,
  ServiceBusinessMetric,
  ServiceBusinessPipelineStage,
} from "./service-business-workspace-types";

export const servicePipeline: readonly ServiceBusinessPipelineStage[] = [
  {
    title: "Request intake",
    description:
      "Capture service requests, customer context, scope notes, expected deadline, and initial priority.",
    items: ["Customer profile", "Service category", "Scope notes", "Target deadline"],
  },
  {
    title: "Job planning",
    description:
      "Break a request into jobs, assign responsible staff, estimate effort, and define acceptance criteria.",
    items: ["Job cards", "Assignee", "Estimated hours", "Checklist"],
  },
  {
    title: "Costing & quotation",
    description:
      "Estimate labor, operational expense, materials, margin, discount, tax, and quotation validity.",
    items: ["Labor cost", "Operational expense", "Margin", "Quote preview"],
  },
  {
    title: "Delivery & invoice",
    description:
      "Track delivery status, completion evidence, invoice generation, payment status, and customer handoff.",
    items: ["Completion proof", "Invoice", "Payment", "After-service note"],
  },
];

export const serviceMetrics: readonly ServiceBusinessMetric[] = [
  {
    label: "Estimated revenue",
    value: "Rp36.750.000",
    description: "Approved and drafted quotation value in this mocked workspace.",
    trendLabel: "+18% vs previous mock cycle",
  },
  {
    label: "Open service jobs",
    value: "3",
    description: "Requests that passed intake but are not fully closed yet.",
    trendLabel: "2 active, 1 waiting review",
  },
  {
    label: "Avg. target margin",
    value: "32%",
    description: "Target margin before tax and discount rules are applied.",
    trendLabel: "Uses draft pricing rules",
  },
  {
    label: "Invoice collection",
    value: "64%",
    description: "Paid amount compared with issued invoice value in mock data.",
    trendLabel: "1 invoice overdue risk",
  },
];

export const pricingInputs = [
  "Service category",
  "Estimated labor hours",
  "Staff hourly cost",
  "Operational expense allocation",
  "Material or external vendor cost",
  "Target profit margin",
  "Tax and discount rules",
  "Invoice payment term",
] as const;

export const serviceConfigDraft: ServiceBusinessConfigDraft = {
  defaultTaxRate: 11,
  defaultMarginRate: 32,
  defaultPaymentTermDays: 14,
  serviceCategories: [
    "Installation",
    "Repair & maintenance",
    "Consulting package",
    "Custom production",
    "After-sales support",
  ],
  approvalRules: [
    "Quotation above Rp15.000.000 needs owner approval.",
    "Discount above 10% needs manager approval.",
    "External vendor cost must be attached before quotation approval.",
    "Invoice can only be issued after delivery evidence is uploaded.",
  ],
};

export const serviceJobs: readonly ServiceBusinessJob[] = [
  {
    id: "svc_job_001",
    requestCode: "SRV-2026-0001",
    title: "AC maintenance contract for office branch",
    customerName: "PT Sinar Utama",
    customerSegment: "B2B Retainer",
    serviceCategory: "Repair & maintenance",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignedTo: "Field Team A",
    dueDate: "2026-06-21",
    summary:
      "Quarterly maintenance package for 18 AC units, including cleaning, inspection, minor repair, and service report.",
    costLines: [
      {
        id: "cost_001_labor",
        label: "Technician labor",
        category: "labor",
        quantity: 24,
        unitLabel: "hour",
        unitCost: 85000,
        billable: true,
      },
      {
        id: "cost_001_transport",
        label: "Transport allocation",
        category: "operational",
        quantity: 3,
        unitLabel: "visit",
        unitCost: 175000,
        billable: true,
      },
      {
        id: "cost_001_material",
        label: "Cleaning chemical and consumables",
        category: "material",
        quantity: 18,
        unitLabel: "unit package",
        unitCost: 32000,
        billable: true,
      },
    ],
    checklist: [
      "Confirm branch access schedule",
      "Complete unit inspection sheet",
      "Upload before-after photos",
      "Send maintenance report to customer",
    ],
    quote: {
      id: "quote_001",
      code: "QTN-2026-0001",
      status: "approved",
      validUntil: "2026-06-30",
      discountAmount: 250000,
      taxRate: 11,
      targetMarginRate: 35,
      customerApprovedAt: "2026-06-12",
    },
    invoice: {
      id: "invoice_001",
      code: "INV-2026-0001",
      status: "issued",
      dueDate: "2026-07-05",
      paidAmount: 0,
    },
    timeline: [
      { label: "Request created", at: "2026-06-10", actor: "Admin" },
      { label: "Quotation approved", at: "2026-06-12", actor: "Customer" },
      { label: "Job started", at: "2026-06-14", actor: "Field Team A" },
    ],
  },
  {
    id: "svc_job_002",
    requestCode: "SRV-2026-0002",
    title: "Landing page setup and analytics handoff",
    customerName: "Kopi Tengah Kota",
    customerSegment: "SMB Project",
    serviceCategory: "Consulting package",
    status: "READY_FOR_REVIEW",
    priority: "NORMAL",
    assignedTo: "Digital Ops",
    dueDate: "2026-06-18",
    summary:
      "Setup landing page content structure, basic SEO checklist, analytics event plan, and handoff documentation.",
    costLines: [
      {
        id: "cost_002_labor",
        label: "Consultant planning",
        category: "labor",
        quantity: 10,
        unitLabel: "hour",
        unitCost: 125000,
        billable: true,
      },
      {
        id: "cost_002_design",
        label: "Template customization",
        category: "labor",
        quantity: 8,
        unitLabel: "hour",
        unitCost: 110000,
        billable: true,
      },
      {
        id: "cost_002_tools",
        label: "Temporary tooling allocation",
        category: "operational",
        quantity: 1,
        unitLabel: "package",
        unitCost: 300000,
        billable: false,
      },
    ],
    checklist: [
      "Review hero copy",
      "Validate lead form event",
      "Export handoff document",
      "Request customer sign-off",
    ],
    quote: {
      id: "quote_002",
      code: "QTN-2026-0002",
      status: "approved",
      validUntil: "2026-06-20",
      discountAmount: 0,
      taxRate: 11,
      targetMarginRate: 40,
      customerApprovedAt: "2026-06-11",
    },
    invoice: {
      id: "invoice_002",
      code: "INV-2026-0002",
      status: "partial",
      dueDate: "2026-06-28",
      paidAmount: 1500000,
    },
    timeline: [
      { label: "Request created", at: "2026-06-08", actor: "Sales" },
      { label: "Quotation approved", at: "2026-06-11", actor: "Customer" },
      { label: "Ready for review", at: "2026-06-16", actor: "Digital Ops" },
    ],
  },
  {
    id: "svc_job_003",
    requestCode: "SRV-2026-0003",
    title: "Custom packaging prototype batch",
    customerName: "Rumah Snack Lestari",
    customerSegment: "Prototype",
    serviceCategory: "Custom production",
    status: "QUOTATION_DRAFT",
    priority: "URGENT",
    assignedTo: "Production Planner",
    dueDate: "2026-06-17",
    summary:
      "Prototype 500 custom packaging units, including vendor coordination, sampling, and one revision cycle.",
    costLines: [
      {
        id: "cost_003_vendor",
        label: "Packaging vendor sample",
        category: "vendor",
        quantity: 500,
        unitLabel: "pcs",
        unitCost: 2800,
        billable: true,
      },
      {
        id: "cost_003_design",
        label: "Artwork adjustment",
        category: "labor",
        quantity: 6,
        unitLabel: "hour",
        unitCost: 95000,
        billable: true,
      },
      {
        id: "cost_003_qc",
        label: "Quality control handling",
        category: "operational",
        quantity: 1,
        unitLabel: "batch",
        unitCost: 225000,
        billable: true,
      },
    ],
    checklist: [
      "Confirm dieline file",
      "Validate vendor quote",
      "Draft quotation for customer",
      "Prepare revision allowance note",
    ],
    quote: {
      id: "quote_003",
      code: "QTN-2026-0003",
      status: "draft",
      validUntil: "2026-06-19",
      discountAmount: 100000,
      taxRate: 11,
      targetMarginRate: 30,
      customerApprovedAt: null,
    },
    invoice: {
      id: "invoice_003",
      code: "INV-2026-0003",
      status: "draft",
      dueDate: "2026-07-03",
      paidAmount: 0,
    },
    timeline: [
      { label: "Request created", at: "2026-06-13", actor: "Admin" },
      { label: "Cost draft started", at: "2026-06-13", actor: "Production Planner" },
    ],
  },
];
