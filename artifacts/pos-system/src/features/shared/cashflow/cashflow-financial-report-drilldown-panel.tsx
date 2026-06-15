"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, RefreshCw, WalletCards } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  cashflowApi,
  type CashflowEntryDto,
  type CashflowQuery,
} from "@/lib/api/cashflow-api";
import {
  consumeCashflowDrilldown,
  type FinancialReportCashflowDrilldownPayload,
} from "@/features/shared/financial-reports/financial-reports-drilldown-bridge";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function displayEnum(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function buildQuery(payload: FinancialReportCashflowDrilldownPayload): CashflowQuery {
  return {
    type: payload.type,
    status: payload.status,
    search: payload.search,
    from: payload.from,
    to: payload.to,
    page: 1,
    limit: 15,
  };
}

export function CashflowFinancialReportDrilldownPanel() {
  const [payload, setPayload] = useState<FinancialReportCashflowDrilldownPayload | null>(null);
  const [rows, setRows] = useState<CashflowEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const drilldown = consumeCashflowDrilldown();
    if (drilldown) setPayload(drilldown);
  }, []);

  const query = useMemo(() => (payload ? buildQuery(payload) : null), [payload]);

  const loadRows = useCallback(async () => {
    if (!query) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await cashflowApi.listEntries(query);
      setRows(response.data ?? []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load cashflow drilldown."));
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  if (!payload) return null;

  const isIncome = payload.type === "INCOME";
  const title = isIncome ? "Financial Reports · Cash In Drilldown" : "Financial Reports · Cash Out Drilldown";
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

  const columns: DataTableColumn<CashflowEntryDto>[] = [
    {
      key: "occurredAt",
      header: "Occurred At",
      cell: (row) => formatDateTime(row.occurredAt),
    },
    { key: "account", header: "Account", cell: (row) => displayEnum(row.account) },
    { key: "type", header: "Type", cell: (row) => displayEnum(row.type) },
    { key: "category", header: "Category", cell: (row) => row.category },
    {
      key: "counterparty",
      header: "Counterparty",
      cell: (row) => row.counterpartyName ?? row.sourceId ?? "-",
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      cell: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span>,
    },
    { key: "status", header: "Status", cell: (row) => row.status },
  ];

  return (
    <DashboardPanel
      title={title}
      description={payload.message ?? "Filtered ledger rows opened from Financial Reports."}
    >
      <div id="financial-report-cashflow-drilldown" className="space-y-4 p-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {displayEnum(payload.type ?? "ALL")} · {payload.status ?? "Any status"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing the first 15 ledger entries for this financial report drilldown.
              </p>
            </div>
          </div>
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={() => void loadRows()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </DashboardActionButton>
            <DashboardActionButton icon={WalletCards} onClick={() => setPayload(null)}>
              Clear Drilldown
            </DashboardActionButton>
          </DashboardActions>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <DataTable
          columns={columns}
          data={rows}
          getRowKey={(row) => row.id}
          minWidth={920}
          emptyMessage={isLoading ? "Loading cashflow drilldown..." : "No ledger rows match this drilldown."}
        />
      </div>
    </DashboardPanel>
  );
}
