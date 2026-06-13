import { BriefcaseBusiness, Clock3, FileText, ReceiptText } from "lucide-react";

import {
  calculateCollectionRate,
  calculateQuoteTotal,
  formatServiceMoney,
  getServiceStatusLabel,
} from "@/app/workspace/custom-business/service/service-business-workspace-domain";
import { serviceJobs } from "@/app/workspace/custom-business/service/service-business-workspace-data";
import { StatCard, StatusPill } from "@/features/shared/cards";
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

export type ServiceBusinessSharedSnapshot = {
  activeJobs: number;
  estimatedRevenue: number;
  pendingCollection: number;
  averageCollectionRate: number;
  openPriorityJobs: number;
  approvedQuotes: number;
  issuedInvoices: number;
  latestStatusLabel: string;
};

const surfaceDescriptions: Record<ServiceBusinessSharedSurface, string> = {
  "business-overview": "Feeds the cross-mode overview with service job, quotation, invoice, and collection context.",
  sales: "Adds service quotation value and client work revenue context to sales analytics.",
  customers: "Adds service clients, request ownership, and assignment context to customer views.",
  inventory: "Adds service cost line context for material, vendor, and operational usage planning.",
  cashflow: "Adds issued invoice and collection context to cash movement planning.",
  "financial-reports": "Adds service margin, collection, and quote totals to report planning.",
  invoice: "Adds service quote and invoice context to invoice drafting views.",
  "cashier-shift-reports": "Adds service collection handoff context without changing cashier flows.",
  hpp: "Adds service cost base, target margin, and quote simulation context.",
  "operation-reports": "Adds service job status and review queue context to closing reports.",
  "team-management": "Adds assigned service job workload context to team views.",
  "roster-overview": "Adds service workload timing context to workforce coverage planning.",
  "employee-performance": "Adds service delivery and job ownership context to performance views.",
  "audit-log": "Adds service activity preview context to future audit trail planning.",
  approvals: "Adds quote approval and invoice readiness context to approval queues.",
  contracts: "Adds client service commitment context without changing employee contract data.",
  attendance: "Adds service assignment context without changing attendance sources.",
  payroll: "Adds service workload and collection context without changing payroll sources.",
  "platform-monitoring": "Adds service workspace readiness context to platform monitoring.",
};

const surfaceTone: Record<ServiceBusinessSharedSurface, DashboardTone> = {
  "business-overview": "blue",
  sales: "green",
  customers: "blue",
  inventory: "amber",
  cashflow: "green",
  "financial-reports": "slate",
  invoice: "blue",
  "cashier-shift-reports": "amber",
  hpp: "green",
  "operation-reports": "amber",
  "team-management": "blue",
  "roster-overview": "slate",
  "employee-performance": "green",
  "audit-log": "slate",
  approvals: "amber",
  contracts: "blue",
  attendance: "green",
  payroll: "amber",
  "platform-monitoring": "slate",
};

export const serviceBusinessSharedSnapshot: ServiceBusinessSharedSnapshot = (() => {
  const activeJobs = serviceJobs.filter((job) => job.status !== "CLOSED").length;
  const estimatedRevenue = serviceJobs.reduce(
    (total, job) => total + calculateQuoteTotal(job),
    0,
  );
  const pendingCollection = serviceJobs.reduce((total, job) => {
    const quoteTotal = calculateQuoteTotal(job);
    return total + Math.max(quoteTotal - job.invoice.paidAmount, 0);
  }, 0);
  const averageCollectionRate = Math.round(
    serviceJobs.reduce((total, job) => {
      return total + calculateCollectionRate(job.invoice, calculateQuoteTotal(job));
    }, 0) / Math.max(serviceJobs.length, 1),
  );
  const openPriorityJobs = serviceJobs.filter((job) => {
    return job.priority === "HIGH" || job.priority === "URGENT";
  }).length;
  const approvedQuotes = serviceJobs.filter((job) => job.quote.status === "approved").length;
  const issuedInvoices = serviceJobs.filter((job) => {
    return job.invoice.status === "issued" || job.invoice.status === "partial" || job.invoice.status === "paid";
  }).length;
  const latestStatusLabel = getServiceStatusLabel(serviceJobs[0]?.status ?? "REQUEST_INTAKE");

  return {
    activeJobs,
    estimatedRevenue,
    pendingCollection,
    averageCollectionRate,
    openPriorityJobs,
    approvedQuotes,
    issuedInvoices,
    latestStatusLabel,
  };
})();

export function ServiceBusinessSharedDashboardBridge({
  surface,
}: {
  surface: ServiceBusinessSharedSurface;
}) {
  const tone = surfaceTone[surface];

  return (
    <section className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-card-foreground">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Service Business shared bridge
            </h2>
            <StatusPill tone={tone}>Frontend-only</StatusPill>
            <StatusPill tone="slate">Custom Business locked</StatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {surfaceDescriptions[surface]}
          </p>
        </div>
        <p className="max-w-md text-xs leading-5 text-muted-foreground">
          This bridge reads the Service / Custom Business mock workspace only. It does not
          create backend routes, Prisma models, mutations, or selector activation.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BriefcaseBusiness}
          label="Service jobs"
          note={`${serviceBusinessSharedSnapshot.openPriorityJobs} high-priority mocked jobs`}
          tone="blue"
          value={String(serviceBusinessSharedSnapshot.activeJobs)}
        />
        <StatCard
          icon={FileText}
          label="Quote value"
          note={`${serviceBusinessSharedSnapshot.approvedQuotes} approved quotes in mock data`}
          tone="green"
          value={formatServiceMoney(serviceBusinessSharedSnapshot.estimatedRevenue)}
        />
        <StatCard
          icon={ReceiptText}
          label="Pending collection"
          note={`${serviceBusinessSharedSnapshot.averageCollectionRate}% average collection rate`}
          tone="amber"
          value={formatServiceMoney(serviceBusinessSharedSnapshot.pendingCollection)}
        />
        <StatCard
          icon={Clock3}
          label="Latest status"
          note={`${serviceBusinessSharedSnapshot.issuedInvoices} issued or partial invoices`}
          tone="slate"
          value={serviceBusinessSharedSnapshot.latestStatusLabel}
        />
      </div>
    </section>
  );
}
