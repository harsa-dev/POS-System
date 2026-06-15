"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Wrench } from "lucide-react";

import { StatCard } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";

import {
  consumeFinancialReportsRepairFeedback,
  type FinancialReportRepairFeedbackPayload,
} from "./financial-reports-drilldown-bridge";
import {
  readFinancialReportsPeriodContext,
  resolveFinancialReportsPeriodContext,
  writeFinancialReportsPeriodContext,
} from "./financial-reports-period-sync";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function applyFeedbackPeriod(feedback: FinancialReportRepairFeedbackPayload) {
  const currentContext =
    readFinancialReportsPeriodContext() ?? resolveFinancialReportsPeriodContext({});

  writeFinancialReportsPeriodContext({
    ...currentContext,
    label: "Post Repair Review",
    from: feedback.from ?? currentContext.from,
    to: feedback.to ?? currentContext.to,
  });
}

function focusMissingCostSnapshots() {
  document.getElementById("financial-reconciliation-missing-cost-snapshots")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function FinancialReportsRepairFeedbackPanel() {
  const [feedback, setFeedback] =
    useState<FinancialReportRepairFeedbackPayload | null>(null);

  useEffect(() => {
    const nextFeedback = consumeFinancialReportsRepairFeedback();
    if (!nextFeedback) return;

    setFeedback(nextFeedback);
    applyFeedbackPeriod(nextFeedback);

    window.setTimeout(() => {
      document.getElementById("financial-reconciliation-drilldown")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }, []);

  const handleRefreshReconciliation = useCallback(() => {
    if (!feedback) return;
    applyFeedbackPeriod(feedback);
    focusMissingCostSnapshots();
  }, [feedback]);

  if (!feedback) return null;

  return (
    <div id="financial-reconciliation-drilldown">
      <DashboardPanel
        title="Repair Result Feedback"
        description="Inventory cost snapshot repair completed. Reconciliation period was synced so source integrity issues can be rechecked against the repaired data."
        action={
          <DashboardActions>
            <DashboardActionButton
              icon={RefreshCw}
              onClick={handleRefreshReconciliation}
            >
              Refresh Reconciliation Context
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
            <div>
              <p className="font-semibold">Cost snapshot repair feedback received.</p>
              <p className="mt-1">
                {feedback.message ??
                  "Financial Reports reconciliation is ready to reload with the repaired period."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <StatCard
              label="Repaired Movements"
              value={formatNumber(feedback.repairedCount)}
              note="Stock movement snapshots backfilled"
              icon={Wrench}
              tone="green"
            />
            <StatCard
              label="Restored COGS"
              value={formatCurrency(feedback.repairedValue)}
              note="Estimated reporting value repaired"
              icon={CheckCircle2}
              tone="blue"
            />
            <StatCard
              label="Repair Completed"
              value={formatDateTime(feedback.completedAt)}
              note="Inventory repair completion time"
              icon={CheckCircle2}
              tone="slate"
            />
            <StatCard
              label="Review Period"
              value={feedback.from && feedback.to ? `${feedback.from} → ${feedback.to}` : "Active range"}
              note="Synced back into reconciliation"
              icon={RefreshCw}
              tone="amber"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Reconciliation is reloaded with the same reporting period used by the inventory repair. If the missing cost snapshot issue remains, inspect rows marked as needing item cost, then rerun the repair preview from Inventory. Apparently data quality does not fix itself out of shame.
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}
