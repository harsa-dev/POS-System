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

export function FinancialReportsDrilldownPanel() {
  return (
    <DashboardPanel
      title="Financial Drilldowns"
      description="Jump from financial report summaries into the operational dashboards that own the source records."
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
              onClick={() =>
                openInvoiceGeneratorDrilldown({
                  status: "ALL",
                  overdue: false,
                  message: "Opened invoice receivables from Financial Reports.",
                })
              }
            >
              Open Receivables
            </DashboardActionButton>
            <DashboardActionButton
              icon={FileSearch}
              onClick={() =>
                openInvoiceGeneratorDrilldown({
                  status: "ALL",
                  overdue: true,
                  message: "Showing overdue receivables from Financial Reports.",
                })
              }
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
              onClick={() =>
                openCashflowDrilldown({
                  type: "INCOME",
                  status: "POSTED",
                  message: "Showing posted cash-in ledger rows from Financial Reports.",
                })
              }
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
              onClick={() =>
                openCashflowDrilldown({
                  type: "EXPENSE",
                  status: "POSTED",
                  message: "Showing posted cash-out ledger rows from Financial Reports.",
                })
              }
            >
              Open Cash Out
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </div>
    </DashboardPanel>
  );
}
