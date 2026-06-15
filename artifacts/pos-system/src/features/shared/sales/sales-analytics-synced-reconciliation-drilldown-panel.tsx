"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";
import { openInventoryCostSnapshotRepair } from "@/features/shared/financial-reports/financial-reports-drilldown-bridge";
import {
  salesAnalyticsApi,
  type SalesAnalyticsReconciliationDetailRowDto,
  type SalesAnalyticsReconciliationDto,
  type SalesAnalyticsReconciliationIssueDto,
  type SalesAnalyticsReconciliationIssueSeverity,
} from "@/lib/api/sales-analytics-api";
import type { SalesPaymentIntegrityIssue } from "@/lib/api/sales-payment-integrity-api";

import {
  getInitialSalesAnalyticsFilterContext,
  SALES_ANALYTICS_FILTER_SYNC_EVENT,
  type SalesAnalyticsFilterContext,
} from "./sales-analytics-filter-sync";
import { openSalesPaymentIntegrityWorkbench } from "./sales-payment-integrity-workbench-events";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getIssueTone(severity: SalesAnalyticsReconciliationIssueSeverity): DashboardTone {
  if (severity === "critical") return "rose";
  if (severity === "warning") return "amber";

  return "slate";
}

function getRowStatusTone(status: string): DashboardTone {
  const normalized = status.toUpperCase();

  if (normalized === "PAID" || normalized === "COMPLETED") return "green";
  if (normalized === "PENDING" || normalized === "PARTIAL") return "amber";
  if (normalized === "FAILED" || normalized === "CANCELLED") return "rose";

  return "slate";
}

type SalesIssueAction = {
  label: string;
  description: string;
  action: "focus" | "inventory_repair" | "payment_integrity" | "none";
  targetId?: string;
  paymentIssue?: SalesPaymentIntegrityIssue;
};

const issueActionMap: Record<string, SalesIssueAction> = {
  orders_without_paid_payment: {
    label: "Open Payment Workbench",
    description: "Open the payment integrity workbench filtered to lifecycle-paid orders without PAID payment records.",
    action: "payment_integrity",
    targetId: "sales-reconciliation-orders-without-paid-payment",
    paymentIssue: "orders_without_paid_payment",
  },
  payment_total_mismatch: {
    label: "Open Payment Workbench",
    description: "Open the payment integrity workbench filtered to paid orders whose amountPaid does not match order total.",
    action: "payment_integrity",
    targetId: "sales-reconciliation-payment-total-mismatches",
    paymentIssue: "payment_total_mismatch",
  },
  missing_cost_snapshots: {
    label: "Open Inventory Repair",
    description: "Open the Inventory cost snapshot repair workflow for missing COGS snapshots.",
    action: "inventory_repair",
    targetId: "sales-reconciliation-missing-cost-snapshots",
  },
  zero_revenue_rows: {
    label: "Focus Rows",
    description: "Review order items with zero or negative price, quantity, or subtotal.",
    action: "focus",
    targetId: "sales-reconciliation-zero-revenue-rows",
  },
  cancelled_orders_excluded: {
    label: "Focus Rows",
    description: "Review cancelled orders excluded from paid sales analytics totals.",
    action: "focus",
    targetId: "sales-reconciliation-cancelled-orders",
  },
  scoped_cogs_hidden: {
    label: "No Repair Needed",
    description: "COGS is intentionally hidden for scoped analytics filters until item-level allocation exists.",
    action: "none",
  },
};

function scrollToTarget(targetId?: string) {
  if (!targetId) return;
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getIssueAction(issue: SalesAnalyticsReconciliationIssueDto) {
  return (
    issueActionMap[issue.key] ?? {
      label: "Focus Rows",
      description: "Review reconciliation detail rows for this sales issue.",
      action: "focus" as const,
    }
  );
}

const detailColumns: DataTableColumn<SalesAnalyticsReconciliationDetailRowDto>[] = [
  { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
  { key: "sourceType", header: "Source", cell: (row) => formatStatusLabel(row.sourceType) },
  {
    key: "reference",
    header: "Reference",
    cell: (row) => <span className="font-medium text-foreground">{row.reference}</span>,
  },
  { key: "description", header: "Description", cell: (row) => row.description },
  { key: "amount", header: "Amount", cell: (row) => formatCurrency(row.amount) },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <StatusPill tone={getRowStatusTone(row.status)}>
        {formatStatusLabel(row.status)}
      </StatusPill>
    ),
  },
];

function ReconciliationDetailSection({
  id,
  title,
  description,
  rows,
}: {
  id: string;
  title: string;
  description: string;
  rows: SalesAnalyticsReconciliationDetailRowDto[];
}) {
  if (rows.length === 0) return null;

  return (
    <div id={id} className="scroll-mt-24">
      <DashboardPanel title={title} description={description}>
        <DataTable
          columns={detailColumns}
          data={rows}
          getRowKey={(row) => row.id}
          minWidth={1080}
          pagination={{ pageSize: 5 }}
        />
      </DashboardPanel>
    </div>
  );
}

function formatFilterSummary(context: SalesAnalyticsFilterContext) {
  const parts = [
    context.filters.productLabel,
    context.filters.categoryLabel,
    context.filters.paymentMethodLabel,
    context.filters.orderStatusLabel,
  ].filter(Boolean);

  if (context.filters.search) {
    parts.push(`Search: ${context.filters.search}`);
  }

  return parts.join(" · ");
}

export function SalesAnalyticsSyncedReconciliationDrilldownPanel() {
  const [filterContext, setFilterContext] = useState<SalesAnalyticsFilterContext>(() =>
    getInitialSalesAnalyticsFilterContext(),
  );
  const [reconciliation, setReconciliation] =
    useState<SalesAnalyticsReconciliationDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReconciliation = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await salesAnalyticsApi.getReconciliation(filterContext.query);
      setReconciliation(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load sales reconciliation drilldown.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filterContext.query]);

  useEffect(() => {
    void loadReconciliation();
  }, [loadReconciliation]);

  useEffect(() => {
    const handleFilterSync = (event: Event) => {
      const detail = (event as CustomEvent<SalesAnalyticsFilterContext>).detail;
      if (detail?.query) {
        setFilterContext(detail);
      }
    };

    window.addEventListener(SALES_ANALYTICS_FILTER_SYNC_EVENT, handleFilterSync);

    return () => {
      window.removeEventListener(SALES_ANALYTICS_FILTER_SYNC_EVENT, handleFilterSync);
    };
  }, []);

  const issueSummary = useMemo(() => {
    const issues = reconciliation?.issues ?? [];

    return {
      total: issues.length,
      critical: issues.filter((issue) => issue.severity === "critical").length,
      warning: issues.filter((issue) => issue.severity === "warning").length,
      info: issues.filter((issue) => issue.severity === "info").length,
    };
  }, [reconciliation?.issues]);

  const handleIssueAction = useCallback(
    (issue: SalesAnalyticsReconciliationIssueDto) => {
      const action = getIssueAction(issue);

      if (action.action === "focus") {
        scrollToTarget(action.targetId);
        return;
      }

      if (action.action === "payment_integrity") {
        openSalesPaymentIntegrityWorkbench({
          issue: action.paymentIssue,
          message: `Opened from Sales Analytics ${issue.title.toLowerCase()} (${filterContext.label}).`,
        });
        return;
      }

      if (action.action === "inventory_repair") {
        openInventoryCostSnapshotRepair({
          from: reconciliation?.period.from ?? filterContext.query.from,
          to: reconciliation?.period.to ?? filterContext.query.to,
          sourceIssue: "missing_cost_snapshots",
          message: `Opened from Sales Analytics missing COGS snapshot reconciliation (${filterContext.label}).`,
        });
      }
    },
    [
      filterContext.label,
      filterContext.query.from,
      filterContext.query.to,
      reconciliation?.period.from,
      reconciliation?.period.to,
    ],
  );

  return (
    <DashboardPanel
      title="Sales Reconciliation Drilldowns"
      description="Action bridge for backend sales integrity issues. This panel follows the active Sales Analytics filters. A tiny miracle: two panels now agree on time."
    >
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard
            label="Issues"
            value={isLoading ? "Loading..." : formatNumber(issueSummary.total)}
            note="Backend reconciliation"
            icon={ShieldAlert}
            tone="blue"
          />
          <StatCard
            label="Critical"
            value={formatNumber(issueSummary.critical)}
            note="Payment/order integrity"
            icon={AlertTriangle}
            tone="rose"
          />
          <StatCard
            label="Warnings"
            value={formatNumber(issueSummary.warning)}
            note="COGS/data quality"
            icon={PackageSearch}
            tone="amber"
          />
          <StatCard
            label="Info"
            value={formatNumber(issueSummary.info)}
            note="Intentional exclusions"
            icon={Search}
            tone="slate"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Synced analytics scope</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {reconciliation
                ? `${formatDate(reconciliation.period.from)} - ${formatDate(reconciliation.period.to)}`
                : filterContext.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatFilterSummary(filterContext)}
            </p>
          </div>
          <DashboardActions>
            <DashboardActionButton
              icon={RefreshCw}
              onClick={() => void loadReconciliation()}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </DashboardActionButton>
          </DashboardActions>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {!isLoading && reconciliation && reconciliation.issues.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No actionable sales reconciliation issues were found for this filter.
          </div>
        )}

        {reconciliation && reconciliation.issues.length > 0 && (
          <div className="grid gap-3 lg:grid-cols-2">
            {reconciliation.issues.map((issue) => {
              const action = getIssueAction(issue);

              return (
                <div
                  key={issue.key}
                  className="rounded-xl border border-border bg-card p-4 text-card-foreground"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{issue.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
                    </div>
                    <StatusPill tone={getIssueTone(issue.severity)}>
                      {formatStatusLabel(issue.severity)}
                    </StatusPill>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-2xl font-semibold text-foreground">
                        {formatNumber(issue.count)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <DashboardActionButton
                      icon={
                        action.action === "inventory_repair" || action.action === "payment_integrity"
                          ? ExternalLink
                          : Search
                      }
                      onClick={() => handleIssueAction(issue)}
                      disabled={action.action === "none"}
                    >
                      {action.label}
                    </DashboardActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {reconciliation && (
          <div className="grid gap-4">
            <ReconciliationDetailSection
              id="sales-reconciliation-orders-without-paid-payment"
              title="Orders Without Paid Payment"
              description="Lifecycle-paid orders without a PAID payment record. Use Open Payment Workbench for backend detail, export, and review guidance."
              rows={reconciliation.ordersWithoutPaidPayment}
            />
            <ReconciliationDetailSection
              id="sales-reconciliation-payment-total-mismatches"
              title="Payment Total Mismatches"
              description="Paid orders whose amountPaid does not match order total. Use Open Payment Workbench to isolate mismatches before repair automation exists."
              rows={reconciliation.paymentTotalMismatches}
            />
            <ReconciliationDetailSection
              id="sales-reconciliation-missing-cost-snapshots"
              title="Missing Cost Snapshots"
              description="Recipe usage stock movements without unitCostSnapshot. Use Open Inventory Repair to backfill repairable rows."
              rows={reconciliation.missingCostSnapshots}
            />
            <ReconciliationDetailSection
              id="sales-reconciliation-zero-revenue-rows"
              title="Invalid Order Item Values"
              description="Order items with zero or negative price, quantity, or subtotal. These need operational data correction before analytics can trust them."
              rows={reconciliation.zeroRevenueRows}
            />
            <ReconciliationDetailSection
              id="sales-reconciliation-cancelled-orders"
              title="Cancelled Orders In Period"
              description="Cancelled orders excluded from paid sales analytics totals. Usually informational unless cancellation volume is suspicious."
              rows={reconciliation.cancelledOrdersInPeriod}
            />
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
