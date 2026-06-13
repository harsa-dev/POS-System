import type { DashboardTone } from "@/features/shared/types";

export type ServiceBusinessSharedSurface =
  | "business-overview"
  | "sales"
  | "customers"
  | "inventory"
  | "cashflow"
  | "financial-reports"
  | "invoice"
  | "cashier-shift-reports"
  | "hpp"
  | "operation-reports"
  | "team-management"
  | "roster-overview"
  | "employee-performance"
  | "audit-log"
  | "approvals"
  | "contracts"
  | "attendance"
  | "payroll"
  | "platform-monitoring";

export type ServiceBusinessSharedSurfaceRelevance =
  | "primary"
  | "supporting"
  | "hidden";

export type ServiceBusinessSharedSurfaceConfig = Readonly<{
  surface: ServiceBusinessSharedSurface;
  label: string;
  relevance: ServiceBusinessSharedSurfaceRelevance;
  tone: DashboardTone;
  servicePurpose: string;
  visibleForService: readonly string[];
  hiddenForService: readonly string[];
  hiddenReason?: string;
}>;

export const serviceBusinessSharedSurfaceConfig = {
  "business-overview": {
    surface: "business-overview",
    label: "Business Overview",
    relevance: "primary",
    tone: "blue",
    servicePurpose:
      "Show the service pipeline, open jobs, quote value, collection risk, and readiness signals.",
    visibleForService: [
      "service job pipeline",
      "quotation value",
      "pending collection",
      "customer handoff readiness",
    ],
    hiddenForService: [
      "restaurant table state",
      "product stock movement",
      "cashier terminal metrics",
    ],
  },
  sales: {
    surface: "sales",
    label: "Sales Analytics",
    relevance: "primary",
    tone: "green",
    servicePurpose:
      "Treat sales as approved quotation value, invoiced service work, client segment value, and margin health.",
    visibleForService: [
      "approved quotation value",
      "service revenue estimate",
      "client segment value",
      "gross margin preview",
    ],
    hiddenForService: [
      "menu item sales mix",
      "SKU sales velocity",
      "dine-in takeaway split",
    ],
  },
  customers: {
    surface: "customers",
    label: "Customers & Partners",
    relevance: "primary",
    tone: "blue",
    servicePurpose:
      "Use customer views for service clients, request owners, partner/vendor involvement, and repeat work potential.",
    visibleForService: [
      "service clients",
      "request contacts",
      "customer segment",
      "assigned owner",
    ],
    hiddenForService: [
      "retail loyalty points",
      "walk-in table customer flow",
      "generic POS buyer segmentation",
    ],
  },
  inventory: {
    surface: "inventory",
    label: "Inventory Management",
    relevance: "hidden",
    tone: "amber",
    servicePurpose:
      "Not called for service mode until service jobs have real material usage, vendor purchase, or spare-part schema.",
    visibleForService: [],
    hiddenForService: [
      "stock opname",
      "SKU quantity cards",
      "warehouse transfer",
      "recipe or material depletion",
    ],
    hiddenReason:
      "Current service mode is job, quote, invoice, and collection focused. Inventory would be misleading without service material records.",
  },
  cashflow: {
    surface: "cashflow",
    label: "Cashflow",
    relevance: "primary",
    tone: "green",
    servicePurpose:
      "Show invoice issue, partial payment, pending collection, and service receivable movement.",
    visibleForService: [
      "issued invoice amount",
      "paid amount",
      "pending collection",
      "payment method preview",
    ],
    hiddenForService: [
      "cash drawer open/close",
      "restaurant shift cash variance",
      "retail register settlement",
    ],
  },
  "financial-reports": {
    surface: "financial-reports",
    label: "Financial Reports",
    relevance: "primary",
    tone: "slate",
    servicePurpose:
      "Report service margin, quote totals, cost line base, invoice status, and collection health.",
    visibleForService: [
      "service margin preview",
      "cost line base",
      "quotation total",
      "invoice collection rate",
    ],
    hiddenForService: [
      "food cost summary",
      "retail stock valuation",
      "cashier-only settlement report",
    ],
  },
  invoice: {
    surface: "invoice",
    label: "Invoice Generator",
    relevance: "primary",
    tone: "blue",
    servicePurpose:
      "Keep invoice generation focused on service quote conversion, client billing terms, and collection notes.",
    visibleForService: [
      "service quotation reference",
      "client billing identity",
      "payment term",
      "collection status",
      "handoff note",
    ],
    hiddenForService: [
      "product SKU rows",
      "retail barcode fields",
      "restaurant receipt footer behavior",
      "cashier shift settlement controls",
    ],
  },
  "cashier-shift-reports": {
    surface: "cashier-shift-reports",
    label: "Cashier Shift Reports",
    relevance: "hidden",
    tone: "amber",
    servicePurpose:
      "Not called for service mode because service billing is invoice and collection based, not cashier shift based.",
    visibleForService: [],
    hiddenForService: [
      "cashier shift open/close",
      "expected cash drawer",
      "register variance",
      "terminal settlement",
    ],
    hiddenReason:
      "Service jobs can be paid later by invoice, transfer, or milestone. Cashier shift reporting would create wrong operational assumptions.",
  },
  hpp: {
    surface: "hpp",
    label: "HPP Calculator",
    relevance: "supporting",
    tone: "green",
    servicePurpose:
      "Reuse only the costing idea for service cost lines, target margin, quote simulation, and billable/non-billable cost review.",
    visibleForService: [
      "service cost line base",
      "target margin",
      "billable cost simulation",
      "quote total preview",
    ],
    hiddenForService: [
      "recipe ingredient usage",
      "stock unit conversion",
      "food/menu COGS assumptions",
    ],
  },
  "operation-reports": {
    surface: "operation-reports",
    label: "Shift Reports",
    relevance: "supporting",
    tone: "amber",
    servicePurpose:
      "Use only for service delivery summary, status movement, review queue, and handoff notes.",
    visibleForService: [
      "job completion summary",
      "ready-for-review queue",
      "delivery status",
      "handoff note",
    ],
    hiddenForService: [
      "restaurant shift closing",
      "table turnover report",
      "cashier terminal close report",
    ],
  },
  "team-management": {
    surface: "team-management",
    label: "Team Management",
    relevance: "supporting",
    tone: "blue",
    servicePurpose:
      "Use team management only for assignment ownership, workload, service lead, and review responsibility.",
    visibleForService: [
      "assigned service owner",
      "workload by assignee",
      "review responsibility",
      "job handoff owner",
    ],
    hiddenForService: [
      "cashier station assignment",
      "restaurant role stationing",
      "retail floor coverage",
    ],
  },
  "roster-overview": {
    surface: "roster-overview",
    label: "Shift Overview",
    relevance: "hidden",
    tone: "slate",
    servicePurpose:
      "Not called until service scheduling and capacity planning exist as first-class data.",
    visibleForService: [],
    hiddenForService: [
      "shift roster coverage",
      "clock-in coverage",
      "floor staffing map",
    ],
    hiddenReason:
      "Current service mode has assigned jobs but no real service scheduling model yet.",
  },
  "employee-performance": {
    surface: "employee-performance",
    label: "Employee Performance",
    relevance: "supporting",
    tone: "green",
    servicePurpose:
      "Use performance only as service delivery ownership, checklist completion, review handoff, and job throughput.",
    visibleForService: [
      "assigned job count",
      "completed checklist rate",
      "ready-for-review count",
      "handoff completion",
    ],
    hiddenForService: [
      "cashier sales target",
      "table service speed",
      "retail upsell target",
    ],
  },
  "audit-log": {
    surface: "audit-log",
    label: "Audit Log",
    relevance: "primary",
    tone: "slate",
    servicePurpose:
      "Use audit logs for request creation, quotation approval, job status movement, invoice issue, and payment recording.",
    visibleForService: [
      "request intake event",
      "quote approval event",
      "status transition event",
      "invoice/payment event",
    ],
    hiddenForService: [
      "cash drawer audit",
      "stock adjustment audit",
      "restaurant order void audit",
    ],
  },
  approvals: {
    surface: "approvals",
    label: "Approval Center",
    relevance: "primary",
    tone: "amber",
    servicePurpose:
      "Use approvals for quotation approval, invoice readiness, customer sign-off, and job close readiness.",
    visibleForService: [
      "quotation approval",
      "invoice readiness approval",
      "customer delivery sign-off",
      "job close approval",
    ],
    hiddenForService: [
      "purchase stock approval",
      "cashier override approval",
      "menu item approval",
    ],
  },
  contracts: {
    surface: "contracts",
    label: "Employee Contracts",
    relevance: "hidden",
    tone: "blue",
    servicePurpose:
      "Not called for service mode because this dashboard is employee-contract oriented, not client service contract oriented.",
    visibleForService: [],
    hiddenForService: [
      "employee contract status",
      "employment document expiry",
      "HR agreement cards",
    ],
    hiddenReason:
      "Service client contract/retainer tracking needs a different model from employee contract tracking.",
  },
  attendance: {
    surface: "attendance",
    label: "Employee Attendance",
    relevance: "hidden",
    tone: "green",
    servicePurpose:
      "Not called for service mode until service work scheduling and staff attendance are linked.",
    visibleForService: [],
    hiddenForService: [
      "clock-in records",
      "late attendance summary",
      "attendance correction workflow",
    ],
    hiddenReason:
      "Attendance exists as HR data, not as service job execution data in the current blueprint.",
  },
  payroll: {
    surface: "payroll",
    label: "Payroll",
    relevance: "hidden",
    tone: "amber",
    servicePurpose:
      "Not called for service mode because service job margin and billing should not be mixed with payroll computation yet.",
    visibleForService: [],
    hiddenForService: [
      "salary calculation",
      "payroll deductions",
      "staff payout approval",
    ],
    hiddenReason:
      "Payroll is not required for service request, quotation, invoice, or collection workflow.",
  },
  "platform-monitoring": {
    surface: "platform-monitoring",
    label: "Developer Monitoring",
    relevance: "hidden",
    tone: "slate",
    servicePurpose:
      "Not called for service mode business workflow. Keep platform monitoring separate from operational dashboards.",
    visibleForService: [],
    hiddenForService: [
      "deployment status",
      "developer console signal",
      "runtime monitoring cards",
    ],
    hiddenReason:
      "Platform monitoring is technical operations, not Service Business workflow.",
  },
} as const satisfies Record<ServiceBusinessSharedSurface, ServiceBusinessSharedSurfaceConfig>;

export function getServiceBusinessSharedSurfaceConfig(
  surface: ServiceBusinessSharedSurface,
): ServiceBusinessSharedSurfaceConfig {
  return serviceBusinessSharedSurfaceConfig[surface];
}

export function shouldCallServiceBusinessSharedSurface(
  surface: ServiceBusinessSharedSurface,
): boolean {
  return getServiceBusinessSharedSurfaceConfig(surface).relevance !== "hidden";
}

export function shouldHideSharedDashboardForServiceMode(
  surface: ServiceBusinessSharedSurface,
): boolean {
  return getServiceBusinessSharedSurfaceConfig(surface).relevance === "hidden";
}
