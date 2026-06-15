import { useEffect, useState, type ReactNode } from "react";

import {
  getCurrentBusinessMode,
  subscribeToBusinessModeChanges,
} from "@/components/core/business-mode/business-mode-storage";
import {
  restaurantClient,
  type RestaurantSharedDashboardDto,
  type RestaurantSharedDashboardId,
  type RestaurantSharedDashboardRowDto,
} from "@/lib/api";

type RestaurantSharedRenderPolicy = Readonly<{
  renderBaseDashboard: boolean;
  reason: string;
}>;

type RestaurantSharedSource = "loading" | "backend-prisma" | "unavailable";

const restaurantSharedRenderPolicy: Record<
  RestaurantSharedDashboardId,
  RestaurantSharedRenderPolicy
> = {
  overview: {
    renderBaseDashboard: false,
    reason: "Restaurant mode uses menu, table, active order, kitchen, and serving signals from the Restaurant API.",
  },
  sales: {
    renderBaseDashboard: false,
    reason: "Generic sales widgets are hidden because Restaurant sales must follow completed POS orders and payment state.",
  },
  customers: {
    renderBaseDashboard: false,
    reason: "Restaurant guest context is currently table and order-flow based until customer CRM is wired.",
  },
  inventory: {
    renderBaseDashboard: false,
    reason: "Restaurant inventory is recipe-aware and should be scoped to menu stock readiness.",
  },
  cashflow: {
    renderBaseDashboard: false,
    reason: "Restaurant cashflow is currently derived from completed POS order revenue.",
  },
  "financial-reports": {
    renderBaseDashboard: false,
    reason: "Restaurant financial reporting is limited to completed-order revenue until deeper accounting is implemented.",
  },
  "invoice-generator": {
    renderBaseDashboard: false,
    reason: "Restaurant mode prioritizes POS receipts and payment documents over generic invoice generation.",
  },
  "shift-reports": {
    renderBaseDashboard: false,
    reason: "Restaurant shift reporting is represented by kitchen, serving, and table load for this phase.",
  },
  "team-management": {
    renderBaseDashboard: false,
    reason: "Restaurant team context is represented by operational queue pressure before full scheduling is wired.",
  },
  "employee-performance": {
    renderBaseDashboard: false,
    reason: "Restaurant HR analytics are intentionally skipped until staff performance requirements are active.",
  },
  approvals: {
    renderBaseDashboard: false,
    reason: "Restaurant approvals use backend operational signals before a dedicated approval workflow exists.",
  },
  "audit-controls": {
    renderBaseDashboard: false,
    reason: "Restaurant audit controls should be scoped to Restaurant backend policy and operational events.",
  },
  "roster-overview": {
    renderBaseDashboard: false,
    reason: "Restaurant roster surfaces are planned and should not render generic staffing assumptions.",
  },
  "employee-attendance": {
    renderBaseDashboard: false,
    reason: "Restaurant attendance is planned and should not render generic attendance data.",
  },
  "employee-contracts": {
    renderBaseDashboard: false,
    reason: "Restaurant contracts are planned and should not render generic contract data.",
  },
  payroll: {
    renderBaseDashboard: false,
    reason: "Restaurant payroll is planned and should not render generic payroll data.",
  },
};

function getStatusClass(status: RestaurantSharedDashboardRowDto["status"]) {
  if (status === "healthy") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "review") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function useIsRestaurantMode() {
  const [isRestaurantMode, setIsRestaurantMode] = useState(
    () => getCurrentBusinessMode() === "restaurant",
  );

  useEffect(() => {
    return subscribeToBusinessModeChanges((event) => {
      setIsRestaurantMode(event.mode === "restaurant");
    });
  }, []);

  return isRestaurantMode;
}

export function RestaurantSharedDashboardBridge({
  dashboardId,
  children,
}: {
  dashboardId: RestaurantSharedDashboardId;
  children: ReactNode;
}) {
  const isRestaurantMode = useIsRestaurantMode();
  const [dashboard, setDashboard] = useState<RestaurantSharedDashboardDto | null>(null);
  const [source, setSource] = useState<RestaurantSharedSource>("loading");
  const renderPolicy = restaurantSharedRenderPolicy[dashboardId];
  const sourceLabel = source === "backend-prisma"
    ? "Backend Prisma"
    : source === "loading"
      ? "Loading Restaurant context"
      : "Restaurant API unavailable";

  useEffect(() => {
    if (!isRestaurantMode) {
      setDashboard(null);
      setSource("loading");
      return;
    }

    let isMounted = true;

    restaurantClient
      .getSharedDashboard(dashboardId)
      .then((response) => {
        if (!isMounted) return;
        if (!response.success || !response.data) {
          throw new Error(response.message ?? "Restaurant shared dashboard data is unavailable.");
        }

        setDashboard(response.data);
        setSource("backend-prisma");
      })
      .catch(() => {
        if (!isMounted) return;
        setDashboard(null);
        setSource("unavailable");
      });

    return () => {
      isMounted = false;
    };
  }, [dashboardId, isRestaurantMode]);

  if (!isRestaurantMode) {
    return <>{children}</>;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-emerald-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Restaurant core bridge
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {dashboard?.title ?? "Restaurant dashboard context"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {dashboard?.description ?? "Loading Restaurant menu, table, order, kitchen, and serving context from the backend."}
            </p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {sourceLabel}
          </div>
        </div>

        {dashboard ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {dashboard.metrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{metric.value}</p>
                  <p className="mt-1 text-xs text-emerald-800">{metric.helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {dashboard.rows.slice(0, 6).map((row) => (
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

            <p className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
              {dashboard.bridgeNote}
            </p>
          </>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
            Restaurant shared dashboard data is not available yet. The base dashboard stays hidden so this surface does not show generic data as Restaurant truth.
          </p>
        )}

        {!renderPolicy.renderBaseDashboard && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            Base shared dashboard hidden in Restaurant mode. {renderPolicy.reason}
          </p>
        )}
      </section>

      {renderPolicy.renderBaseDashboard ? children : null}
    </div>
  );
}
