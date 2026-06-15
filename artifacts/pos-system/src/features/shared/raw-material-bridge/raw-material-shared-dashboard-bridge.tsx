import { useEffect, useState, type ReactNode } from "react";

import {
  getCurrentBusinessMode,
  subscribeToBusinessModeChanges,
} from "@/components/core/business-mode/business-mode-storage";
import {
  getRawMaterialSharedDashboardContext,
  rawMaterialApiClient,
  type RawMaterialSummaryResponse,
  type RawMaterialSharedDashboardId,
  type RawMaterialSharedRow,
} from "@/features/raw-material/core-system";

type RawMaterialSharedRenderPolicy = Readonly<{
  renderBaseDashboard: boolean;
  reason: string;
}>;
type RawMaterialSharedSource = "loading" | "backend-summary" | "sample-fallback";

const rawMaterialSharedRenderPolicy: Record<
  RawMaterialSharedDashboardId,
  RawMaterialSharedRenderPolicy
> = {
  overview: {
    renderBaseDashboard: false,
    reason: "Default overview KPIs are business-generic; raw material mode needs intake, batch, storage, kandang, and processing context instead.",
  },
  sales: {
    renderBaseDashboard: false,
    reason: "Sales analytics is not the primary raw material surface; raw material mode needs operational volume, rejection, and yield analytics.",
  },
  customers: {
    renderBaseDashboard: false,
    reason: "Customer CRM is replaced by supplier and partner control in raw material mode.",
  },
  inventory: {
    renderBaseDashboard: false,
    reason: "Generic product inventory is hidden because raw material mode needs lot, storage, FEFO, quality, and batch readiness instead.",
  },
  cashflow: {
    renderBaseDashboard: false,
    reason: "Generic cashflow is hidden until supplier payable, procurement planning, and material cost rules exist for raw material mode.",
  },
  "financial-reports": {
    renderBaseDashboard: false,
    reason: "Generic financial reports are hidden because raw material mode currently has cost planning, rejection loss, and yield context only.",
  },
  "invoice-generator": {
    renderBaseDashboard: false,
    reason: "Customer invoice generation is hidden; raw material mode only needs supplier receiving and invoice-hold context for now.",
  },
  "shift-reports": {
    renderBaseDashboard: false,
    reason: "Restaurant/cashier shift reporting is hidden; raw material mode needs weighing, receiving, and processing operator activity.",
  },
  "team-management": {
    renderBaseDashboard: false,
    reason: "Generic HR surfaces are hidden; raw material mode only needs operator responsibility, supplier ownership, and kandang watch context here.",
  },
  "employee-performance": {
    renderBaseDashboard: false,
    reason: "Employee performance is hidden as payroll-like logic; raw material mode only previews operational performance signals.",
  },
  approvals: {
    renderBaseDashboard: false,
    reason: "Generic approvals are hidden; raw material mode needs quality holds, factory planning, and kandang monitoring approvals later.",
  },
  "hpp-calculator": {
    renderBaseDashboard: false,
    reason: "Restaurant recipe HPP is hidden; raw material mode needs material cost, rejection loss, batch cost, and processing-yield preview instead.",
  },
};

function getStatusClass(status: RawMaterialSharedRow["status"]) {
  if (status === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "review") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function useIsRawMaterialMode() {
  const [isRawMaterialMode, setIsRawMaterialMode] = useState(
    () => getCurrentBusinessMode() === "raw-material",
  );

  useEffect(() => {
    return subscribeToBusinessModeChanges((event) => {
      setIsRawMaterialMode(event.mode === "raw-material");
    });
  }, []);

  return isRawMaterialMode;
}

export function RawMaterialSharedDashboardBridge({
  dashboardId,
  children,
}: {
  dashboardId: RawMaterialSharedDashboardId;
  children: ReactNode;
}) {
  const isRawMaterialMode = useIsRawMaterialMode();
  const [summary, setSummary] = useState<RawMaterialSummaryResponse | null>(null);
  const [source, setSource] = useState<RawMaterialSharedSource>("loading");
  const context = getRawMaterialSharedDashboardContext(dashboardId, summary);
  const renderPolicy = rawMaterialSharedRenderPolicy[dashboardId];
  const sourceLabel = source === "backend-summary"
    ? "Backend summary"
    : source === "loading"
      ? "Loading summary"
      : "Sample fallback";

  useEffect(() => {
    if (!isRawMaterialMode) {
      setSummary(null);
      setSource("loading");
      return;
    }

    const controller = new AbortController();

    rawMaterialApiClient
      .getSummary(controller.signal)
      .then((data) => {
        setSummary(data);
        setSource("backend-summary");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSummary(null);
        setSource("sample-fallback");
      });

    return () => controller.abort();
  }, [isRawMaterialMode]);

  if (!isRawMaterialMode) {
    return <>{children}</>;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-amber-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
              Raw material core bridge
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{context.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {context.description}
            </p>
          </div>
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {sourceLabel}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {context.metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-700">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{metric.value}</p>
              <p className="mt-1 text-xs text-amber-800">{metric.helper}</p>
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

        <p className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          {context.bridgeNote}
        </p>

        {!renderPolicy.renderBaseDashboard && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            Base shared dashboard hidden in raw material mode. {renderPolicy.reason}
          </p>
        )}
      </section>

      {renderPolicy.renderBaseDashboard ? children : null}
    </div>
  );
}
