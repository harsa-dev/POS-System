import { useEffect, useState, type ReactNode } from "react";

import {
  getCurrentBusinessMode,
  subscribeToBusinessModeChanges,
} from "@/components/core/business-mode/business-mode-storage";
import {
  getRetailSharedDashboardContext,
  type RetailSharedDashboardId,
  type RetailSharedRow,
} from "@/features/retail/core-system";

function getStatusClass(status: RetailSharedRow["status"]) {
  if (status === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "review") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function useIsRetailMode() {
  const [isRetailMode, setIsRetailMode] = useState(() => getCurrentBusinessMode() === "retail");

  useEffect(() => {
    return subscribeToBusinessModeChanges((event) => {
      setIsRetailMode(event.mode === "retail");
    });
  }, []);

  return isRetailMode;
}

export function RetailSharedDashboardBridge({
  dashboardId,
  children,
}: {
  dashboardId: RetailSharedDashboardId;
  children: ReactNode;
}) {
  const isRetailMode = useIsRetailMode();
  const context = getRetailSharedDashboardContext(dashboardId);

  if (!isRetailMode) {
    return <>{children}</>;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Retail core bridge
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{context.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {context.description}
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Mock data only
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{row.primary}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.secondary}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusClass(row.status)}`}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {context.bridgeNote}
        </p>
      </section>

      {children}
    </div>
  );
}
