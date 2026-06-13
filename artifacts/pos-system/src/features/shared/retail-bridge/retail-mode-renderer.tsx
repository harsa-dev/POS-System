import { type ReactNode } from "react";

import {
  getRetailSharedDashboardContext,
  type RetailSharedDashboardId,
} from "@/features/retail/core-system";

export type RetailDashboardRenderMode = "augment" | "replace" | "skip";

function RetailPanel({ dashboardId }: { dashboardId: RetailSharedDashboardId }) {
  const context = getRetailSharedDashboardContext(dashboardId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Retail mode dashboard
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{context.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {context.description}
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          Mock data
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {context.metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {context.rows.slice(0, 6).map((row) => (
          <div key={`${row.title}-${row.primary}`} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-950">{row.title}</p>
            <p className="mt-1 text-sm text-slate-600">{row.primary}</p>
            <p className="mt-1 text-xs text-slate-500">{row.secondary}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        {context.bridgeNote}
      </p>
    </section>
  );
}

export function renderRetailDashboardMode({
  dashboardId,
  mode,
  children,
}: {
  dashboardId: RetailSharedDashboardId;
  mode: RetailDashboardRenderMode;
  children: ReactNode;
}) {
  if (mode === "replace") {
    return <RetailPanel dashboardId={dashboardId} />;
  }

  if (mode === "skip") {
    return (
      <div className="grid gap-5">
        <RetailPanel dashboardId={dashboardId} />
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          Shared dashboard component is not rendered for retail mode on this page.
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <RetailPanel dashboardId={dashboardId} />
      {children}
    </div>
  );
}
