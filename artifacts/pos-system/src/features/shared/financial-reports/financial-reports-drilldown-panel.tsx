"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  FileSearch,
  FileText,
  WalletCards,
} from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";

import {
  openCashflowDrilldown,
  openInvoiceGeneratorDrilldown,
} from "./financial-reports-drilldown-bridge";
import {
  readFinancialReportsPeriodContext,
  resolveFinancialReportsPeriodContext,
} from "./financial-reports-period-sync";

function getActivePeriodContext() {
  return (
    readFinancialReportsPeriodContext() ??
    resolveFinancialReportsPeriodContext({})
  );
}

export function FinancialReportsDrilldownPanel() {
  const openReceivables = (overdue: boolean) => {
    const period = getActivePeriodContext();

    openInvoiceGeneratorDrilldown({
      status: "ALL",
      overdue,
      from: period.from,
      to: period.to,
      message: overdue
        ? `Showing overdue receivables from Financial Reports (${period.label}).`
        : `Opened invoice receivables from Financial Reports (${period.label}).`,
    });
  };

  const openCashLedger = (type: "INCOME" | "EXPENSE") => {
    const period = getActivePeriodContext();

    openCashflowDrilldown({
      type,
      status: "POSTED",
      from: period.from,
      to: period.to,
      message:
        type === "INCOME"
          ? `Showing posted cash-in ledger rows from Financial Reports (${period.label}).`
          : `Showing posted cash-out ledger rows from Financial Reports (${period.label}).`,
    });
  };

  return (
    <DashboardPanel
      title="Financial Drilldowns"
      description="Jump from financial report summaries into the operational dashboards that own the source records. Drilldowns follow the active report period."
    >
      <div className="grid gap-4 p-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-foreground">Invoice Receivables</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Open invoice history or focus overdue receivables from the invoice module.
          </p>
          <DashboardActions className="mt-4 flex-wrap">
            <DashboardActionButton
              icon={FileSearch}
              onClick={() => openReceivables(false)}
            >
              Open Receivables
            </DashboardActionButton>
            <DashboardActionButton
              icon={FileSearch}
              onClick={() => openReceivables(true)}
            >
              Show Overdue
            </DashboardActionButton>
          </DashboardActions>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-foreground">Cash In Ledger</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Open posted income ledger rows behind the Cash In report section.
          </p>
          <DashboardActions className="mt-4 flex-wrap">
            <DashboardActionButton
              icon={WalletCards}
              onClick={() => openCashLedger("INCOME")}
            >
              Open Cash In
            </DashboardActionButton>
          </DashboardActions>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100">
            <ArrowDownRight className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-foreground">Cash Out Ledger</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Open posted expense ledger rows behind the Cash Out report section.
          </p>
          <DashboardActions className="mt-4 flex-wrap">
            <DashboardActionButton
              icon={WalletCards}
              onClick={() => openCashLedger("EXPENSE")}
            >
              Open Cash Out
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </div>
    </DashboardPanel>
  );
}
