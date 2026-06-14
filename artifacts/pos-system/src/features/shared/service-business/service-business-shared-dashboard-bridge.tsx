"use client";

import { BriefcaseBusiness, Clock3, EyeOff, FileText, ReceiptText } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  getServiceBusinessSharedSurfaceConfig,
  type ServiceBusinessSharedSurface,
} from "@/features/shared/service-business/service-business-shared-dashboard-config";

export type { ServiceBusinessSharedSurface } from "@/features/shared/service-business/service-business-shared-dashboard-config";

export type ServiceBusinessSharedSnapshot = {
  activeJobs: number;
  estimatedRevenue: number;
  pendingCollection: number;
  averageCollectionRate: number;
  openPriorityJobs: number;
  approvedQuotes: number;
  issuedInvoices: number;
  latestStatusLabel: string;
  sourceLabel: string;
};

const serviceMoneyFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatServiceMoney(value: number) {
  return serviceMoneyFormatter.format(value);
}

export const serviceBusinessSharedSnapshot: ServiceBusinessSharedSnapshot = {
  activeJobs: 0,
  estimatedRevenue: 0,
  pendingCollection: 0,
  averageCollectionRate: 0,
  openPriorityJobs: 0,
  approvedQuotes: 0,
  issuedInvoices: 0,
  latestStatusLabel: "Planned",
  sourceLabel: "Planned preview",
};

export function ServiceBusinessSharedDashboardBridge({
  surface,
}: {
  surface: ServiceBusinessSharedSurface;
}) {
  const surfaceConfig = getServiceBusinessSharedSurfaceConfig(surface);
  const snapshot = serviceBusinessSharedSnapshot;

  return (
    <section className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-card-foreground">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Service Business shared bridge
            </h2>
            <StatusPill tone={surfaceConfig.tone}>
              {surfaceConfig.relevance === "primary" ? "Primary" : "Supporting"}
            </StatusPill>
            <StatusPill tone="slate">
              {snapshot.sourceLabel}
            </StatusPill>
            <StatusPill tone="slate">Custom Business locked</StatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {surfaceConfig.servicePurpose}
          </p>
        </div>
        <p className="max-w-md text-xs leading-5 text-muted-foreground">
          This bridge is intentionally read-only until Custom Business becomes
          selectable and its service workflow is promoted from planned to active.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BriefcaseBusiness}
          label="Service jobs"
          note={`${snapshot.openPriorityJobs} high-priority jobs`}
          tone="blue"
          value={String(snapshot.activeJobs)}
        />
        <StatCard
          icon={FileText}
          label="Quote value"
          note={`${snapshot.approvedQuotes} approved quotes`}
          tone="green"
          value={formatServiceMoney(snapshot.estimatedRevenue)}
        />
        <StatCard
          icon={ReceiptText}
          label="Pending collection"
          note={`${snapshot.averageCollectionRate}% average collection rate`}
          tone="amber"
          value={formatServiceMoney(snapshot.pendingCollection)}
        />
        <StatCard
          icon={Clock3}
          label="Latest status"
          note={`${snapshot.issuedInvoices} issued or partial invoices`}
          tone="slate"
          value={snapshot.latestStatusLabel}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ServiceBusinessCapabilityList
          items={surfaceConfig.visibleForService}
          title="Called for Service mode"
        />
        <ServiceBusinessCapabilityList
          icon="hidden"
          items={surfaceConfig.hiddenForService}
          title="Hidden for Service mode"
        />
      </div>
    </section>
  );
}

export function ServiceBusinessSharedDashboardHiddenNotice({
  surface,
}: {
  surface: ServiceBusinessSharedSurface;
}) {
  const surfaceConfig = getServiceBusinessSharedSurfaceConfig(surface);

  return (
    <section className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-card-foreground">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {surfaceConfig.label} hidden for Service Business
            </h2>
            <StatusPill tone="slate">Not called</StatusPill>
            <StatusPill tone="slate">Mode-specific hide</StatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {surfaceConfig.hiddenReason ?? surfaceConfig.servicePurpose}
          </p>
        </div>
        <div className="flex max-w-md gap-3 rounded-lg border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            The original shared dashboard stays in the codebase for other business modes.
            Service mode hides it instead of deleting it.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ServiceBusinessCapabilityList
          icon="hidden"
          items={surfaceConfig.hiddenForService}
          title="Hidden items"
        />
      </div>
    </section>
  );
}

function ServiceBusinessCapabilityList({
  title,
  items,
  icon = "visible",
}: {
  title: string;
  items: readonly string[];
  icon?: "visible" | "hidden";
}) {
  const hasItems = items.length > 0;

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <StatusPill tone={icon === "hidden" ? "slate" : "blue"}>
          {hasItems ? `${items.length} items` : "None"}
        </StatusPill>
      </div>
      {hasItems ? (
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="rounded-md bg-muted/50 px-2 py-1">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          No service-mode capabilities are called from this shared dashboard.
        </p>
      )}
    </div>
  );
}
