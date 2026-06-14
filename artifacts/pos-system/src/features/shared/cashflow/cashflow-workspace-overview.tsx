"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Database, Landmark, RefreshCw, ShieldCheck } from "lucide-react";

import { businessModeService } from "@/components/core/business-mode/business-mode-service";
import {
  DashboardPanel,
  getSharedDashboardModeContext,
} from "@/features/shared/dashboard";

const workflowSteps = [
  {
    title: "Review balances",
    description: "Start from backend account balances before touching ledger rows.",
  },
  {
    title: "Sync sources",
    description: "Pull paid orders and closed shifts into the ledger idempotently.",
  },
  {
    title: "Add manual entry",
    description: "Use manual records only for non-source-backed cashflow events.",
  },
  {
    title: "Audit history",
    description: "Filter, export, and void entries without deleting the audit trail.",
  },
];

export function CashflowWorkspaceOverview() {
  const [modeContext, setModeContext] = useState(() =>
    getSharedDashboardModeContext("cashflow"),
  );

  useEffect(() => {
    return businessModeService.subscribe(() => {
      setModeContext(getSharedDashboardModeContext("cashflow"));
    });
  }, []);

  return (
    <DashboardPanel
      title="Cashflow Workspace"
      description="Backend-ledger workspace for balances, source sync, manual entries, reconciliation, and export. The important part is that the browser no longer cosplays as accounting software."
    >
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {modeContext.activeModeShortLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
              <Database className="h-3.5 w-3.5" />
              {modeContext.queryScopeKey}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              <Landmark className="h-3.5 w-3.5" />
              Business-scoped ledger
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {index < workflowSteps.length - 1 ? (
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <RefreshCw className="h-4 w-4 text-neutral-400" />
                  )}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-neutral-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
          <p className="text-sm font-semibold text-neutral-900">Polished flow rule</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Balances and source sync sit above the detailed dashboard because they decide whether
            the ledger is trustworthy before users inspect trends, filters, exports, and manual rows.
          </p>
        </div>
      </div>
    </DashboardPanel>
  );
}
