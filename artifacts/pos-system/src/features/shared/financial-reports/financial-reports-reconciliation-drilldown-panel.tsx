"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import {
  DataTable,
  type DataTableColumn,
} from "@/features/shared/table";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  financialReportsReconciliationApi,
  type FinancialReconciliationDetailRowDto,
  type FinancialReconciliationDto,
  type FinancialReconciliationIssueDto,
} from "@/lib/api/financial-reports-reconciliation-api";

import {
  openCashflowDrilldown,
  openInventoryCostSnapshotRepair,
  openInvoiceGeneratorDrilldown,
} from "./financial-reports-drilldown-bridge";
import {
  FINANCIAL_REPORTS_PERIOD_SYNC_EVENT,
  readFinancialReportsPeriodContext,
  resolveFinancialReportsPeriodContext,
  type FinancialReportsPeriodContext,
} from "./financial-reports-period-sync";

type ReconciliationTarget = {
  sectionId: string;
  label: string;
  helper: string;
};

type ReconciliationSection = ReconciliationTarget & {
  rows: FinancialReconciliationDetailRowDto[];
  emptyMessage: string;
};

const issueTargets: Record<string, ReconciliationTarget> = {
  orders_without_cashflow: {
    sectionId: "financial-reconciliation-unsynced-orders",
    label: "Unsynced paid orders",
    helper: "Inspect paid orders that still need a cashflow source sync.",
  },
  missing_cost_snapshots: {
    sectionId: "financial-reconciliation-missing-cost-snapshots",
    label: "Missing usable inventory cost",
    helper: "Fix COGS stock movements by updating linked inventory item costs.",
  },
  pending_cashflow_entries: {
    sectionId: "financial-reconciliation-pending-cashflow",
    label: "Pending cashflow entries",
    helper: "Open cashflow ledger filtered to pending entries.",
  },
  voided_cashflow_entries: {
    sectionId: "financial-reconciliation-voided-cashflow",
    label: "Voided cashflow entries",
    helper: "Open cashflow ledger filtered to voided entries.",
  },
  open_receivables: {
    sectionId: "financial-reconciliation-open-receivables",
    label: "Open receivables",
    helper: "Open invoice history filtered to open receivables.",
  },
  overdue_receivables: {
    sectionId: "financial-reconciliation-open-receivables",
    label: "Overdue receivables",
    helper: "Open invoice history filtered to overdue receivables.",
  },
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getIssueClass(issue: FinancialReconciliationIssueDto) {
  if (issue.severity === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  if (issue.severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-blue-200 bg-blue-50 text-blue-900";
}

function getIssueActionLabel(issueKey: string) {
  if (issueKey === "orders_without_cashflow") return "Open Source Sync";
  if (issueKey === "missing_cost_snapshots") return "Open Repair";
  if (issueKey === "pending_cashflow_entries") return "Open Pending Ledger";
  if (issueKey === "voided_cashflow_entries") return "Open Voided Ledger";
  if (issueKey === "open_receivables") return "Open Receivables";
  if (issueKey === "overdue_receivables") return "Open Overdue";

  return "Focus Details";
}

function focusSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function openIssueTarget(
  issue: FinancialReconciliationIssueDto,
  periodContext: FinancialReportsPeriodContext,
) {
  if (issue.key === "orders_without_cashflow") {
    window.location.assign("/dashboard/cashflow#cashflow-source-sync");
    return;
  }

  if (issue.key === "missing_cost_snapshots") {
    openInventoryCostSnapshotRepair({
      from: periodContext.from,
      to: periodContext.to,
      sourceIssue: "missing_cost_snapshots",
      message: `Financial reconciliation review: COGS movements missing cost snapshot (${periodContext.label}).`,
    });
    return;
  }

  if (issue.key === "pending_cashflow_entries") {
    openCashflowDrilldown({
      status: "PENDING",
      from: periodContext.from,
      to: periodContext.to,
      message: `Financial reconciliation drilldown: pending cashflow entries (${periodContext.label}).`,
    });
    return;
  }

  if (issue.key === "voided_cashflow_entries") {
    openCashflowDrilldown({
      status: "VOIDED",
      from: periodContext.from,
      to: periodContext.to,
      message: `Financial reconciliation drilldown: voided cashflow entries (${periodContext.label}).`,
    });
    return;
  }

  if (issue.key === "open_receivables") {
    openInvoiceGeneratorDrilldown({
      status: "ALL",
      overdue: false,
      from: periodContext.from,
      to: periodContext.to,
      message: `Financial reconciliation drilldown: open invoice receivables (${periodContext.label}).`,
    });
    return;
  }

  if (issue.key === "overdue_receivables") {
    openInvoiceGeneratorDrilldown({
      status: "ALL",
      overdue: true,
      from: periodContext.from,
      to: periodContext.to,
      message: `Financial reconciliation drilldown: overdue invoice receivables (${periodContext.label}).`,
    });
    return;
  }

  const target = issueTargets[issue.key];
  if (target) focusSection(target.sectionId);
}

export function FinancialReportsReconciliationDrilldownPanel() {
  const [periodContext, setPeriodContext] =
    useState<FinancialReportsPeriodContext>(() =>
      readFinancialReportsPeriodContext() ??
      resolveFinancialReportsPeriodContext({}),
    );
  const [reconciliation, setReconciliation] =
    useState<FinancialReconciliationDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reconciliationQuery = useMemo(
    () => ({
      from: periodContext.from,
      to: periodContext.to,
      basis: periodContext.basis,
    }),
    [periodContext.basis, periodContext.from, periodContext.to],
  );

  const loadReconciliation = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await financialReportsReconciliationApi.getReconciliation(
        reconciliationQuery,
      );
      setReconciliation(response.data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load reconciliation drilldown."),
      );
      setReconciliation(null);
    } finally {
      setIsLoading(false);
    }
  }, [reconciliationQuery]);

  useEffect(() => {
    void loadReconciliation();
  }, [loadReconciliation]);

  useEffect(() => {
    const storedContext = readFinancialReportsPeriodContext();
    if (storedContext) setPeriodContext(storedContext);

    const handlePeriodSync = (event: Event) => {
      const detail = (event as CustomEvent<FinancialReportsPeriodContext>).detail;
      if (!detail?.from || !detail?.to || !detail.basis) return;

      setPeriodContext(detail);
    };

    window.addEventListener(
      FINANCIAL_REPORTS_PERIOD_SYNC_EVENT,
      handlePeriodSync,
    );

    return () => {
      window.removeEventListener(
        FINANCIAL_REPORTS_PERIOD_SYNC_EVENT,
        handlePeriodSync,
      );
    };
  }, []);

  const sections = useMemo<ReconciliationSection[]>(() => {
    if (!reconciliation) return [];

    return [
      {
        ...issueTargets.orders_without_cashflow,
        rows: reconciliation.unsyncedOrders,
        emptyMessage: "No paid orders without cashflow ledger entries.",
      },
      {
        ...issueTargets.missing_cost_snapshots,
        rows: reconciliation.missingCostSnapshots,
        emptyMessage: "No COGS movements missing a cost snapshot.",
      },
      {
        ...issueTargets.pending_cashflow_entries,
        rows: reconciliation.pendingCashflowEntries,
        emptyMessage: "No pending cashflow entries.",
      },
      {
        ...issueTargets.voided_cashflow_entries,
        rows: reconciliation.voidedCashflowEntries,
        emptyMessage: "No voided cashflow entries.",
      },
      {
        ...issueTargets.open_receivables,
        rows: reconciliation.openReceivables,
        emptyMessage: "No open invoice receivables.",
      },
    ];
  }, [reconciliation]);

  const detailColumns = useMemo<
    DataTableColumn<FinancialReconciliationDetailRowDto>[]
  >(
    () => [
      { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
      {
        key: "sourceType",
        header: "Source Type",
        cell: (row) => row.sourceType,
      },
      { key: "reference", header: "Reference", cell: (row) => row.reference },
      {
        key: "description",
        header: "Description",
        cell: (row) => row.description,
      },
      { key: "status", header: "Status", cell: (row) => row.status },
      {
        key: "amount",
        header: "Amount",
        className: "text-right",
        cell: (row) => (
          <span className="font-semibold">{formatCurrency(row.amount)}</span>
        ),
      },
    ],
    [],
  );

  const totalIssueCount = reconciliation?.issues.reduce(
    (sum, issue) => sum + issue.count,
    0,
  ) ?? 0;

  return (
    <DashboardPanel
      title="Reconciliation Issue Drilldown"
      description="Action bridge for source integrity issues detected by the active financial report period."
      action={
        <DashboardActions>
          <DashboardActionButton
            icon={RefreshCw}
            onClick={() => void loadReconciliation()}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Issues"}
          </DashboardActionButton>
        </DashboardActions>
      }
    >
      <div className="space-y-4 p-4">
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
            <div>
              <p className="font-semibold">Unable to load reconciliation drilldown</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Active Issues
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatNumber(reconciliation?.issues.length ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Affected Rows
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatNumber(totalIssueCount)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Synced Period
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {periodContext.label} · {periodContext.basis}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(periodContext.from)} → {formatDate(periodContext.to)}
            </p>
            {reconciliation && (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                Backend: {formatDate(reconciliation.period.from)} →{" "}
                {formatDate(reconciliation.period.to)}
              </p>
            )}
          </div>
        </div>

        {isLoading && !reconciliation && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Loading reconciliation issue drilldown...
          </p>
        )}

        {reconciliation && reconciliation.issues.length === 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            No reconciliation issues detected for the synced reporting period.
          </div>
        )}

        {reconciliation && reconciliation.issues.length > 0 && (
          <div className="grid gap-3 lg:grid-cols-2">
            {reconciliation.issues.map((issue) => {
              const target = issueTargets[issue.key];

              return (
                <div
                  key={issue.key}
                  className={`rounded-xl border p-4 ${getIssueClass(issue)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{issue.title}</p>
                      <p className="mt-1 text-xs leading-5 opacity-80">
                        {issue.description}
                      </p>
                      {target && (
                        <p className="mt-2 text-xs font-medium opacity-75">
                          Target: {target.label} · {target.helper}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-foreground shadow-sm">
                      {formatNumber(issue.count)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {target && (
                      <DashboardActionButton
                        icon={Search}
                        onClick={() => focusSection(target.sectionId)}
                      >
                        Focus Rows
                      </DashboardActionButton>
                    )}
                    <DashboardActionButton
                      icon={ArrowRight}
                      onClick={() => openIssueTarget(issue, periodContext)}
                    >
                      {getIssueActionLabel(issue.key)}
                    </DashboardActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sections.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-2">
            {sections.map((section) => (
              <div key={section.sectionId} id={section.sectionId}>
                <DashboardPanel
                  title={section.label}
                  description={section.helper}
                  action={
                    <DashboardActions>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {formatNumber(section.rows.length)} rows
                      </span>
                    </DashboardActions>
                  }
                >
                  <DataTable
                    columns={detailColumns}
                    data={section.rows}
                    getRowKey={(row) => row.id}
                    minWidth={860}
                    emptyMessage={section.emptyMessage}
                  />
                </DashboardPanel>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <WalletCards className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              This drilldown follows the active Financial Reports period and
              basis. Use this panel to jump from reconciliation issue cards into
              source rows, invoice receivables, cashflow ledgers, or inventory
              cost snapshot repair. Missing cost snapshot rows now open a repair
              workflow instead of remaining a table-shaped shrug.
            </p>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
