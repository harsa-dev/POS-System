"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, History, RefreshCw, ShieldCheck, Wrench } from "lucide-react";

import {
  financialReportsRepairAuditApi,
  type FinancialRepairAuditDto,
  type FinancialRepairAuditRowDto,
} from "@/lib/api/financial-reports-repair-audit-api";
import { StatCard } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";

import {
  FINANCIAL_REPORTS_PERIOD_SYNC_EVENT,
  readFinancialReportsPeriodContext,
  resolveFinancialReportsPeriodContext,
  type FinancialReportsPeriodContext,
} from "./financial-reports-period-sync";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function downloadJson(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, filename);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitialPeriodContext() {
  return readFinancialReportsPeriodContext() ?? resolveFinancialReportsPeriodContext({});
}

export function FinancialReportsRepairAuditPanel() {
  const [periodContext, setPeriodContext] =
    useState<FinancialReportsPeriodContext>(() => getInitialPeriodContext());
  const [audit, setAudit] = useState<FinancialRepairAuditDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<"csv" | "json" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      from: periodContext.from,
      to: periodContext.to,
      basis: periodContext.basis,
      limit: 100,
    }),
    [periodContext],
  );

  const loadAudit = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await financialReportsRepairAuditApi.getAudit(query);
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load repair audit trail.");
        return;
      }

      setAudit(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load repair audit trail.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  useEffect(() => {
    function handlePeriodSync(event: Event) {
      const customEvent = event as CustomEvent<FinancialReportsPeriodContext>;
      setPeriodContext(customEvent.detail);
    }

    window.addEventListener(FINANCIAL_REPORTS_PERIOD_SYNC_EVENT, handlePeriodSync);
    return () => window.removeEventListener(FINANCIAL_REPORTS_PERIOD_SYNC_EVENT, handlePeriodSync);
  }, []);

  async function handleExportCsv() {
    setIsExporting("csv");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const download = await financialReportsRepairAuditApi.downloadCsv(query);
      downloadBlob(download.blob, download.filename);
      setSuccessMessage(`Exported ${download.rowCount ?? "all"} repair audit row(s) to CSV.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export repair audit CSV.");
    } finally {
      setIsExporting(null);
    }
  }

  async function handleExportJson() {
    setIsExporting("json");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await financialReportsRepairAuditApi.exportJson(query);
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to export repair audit JSON.");
        return;
      }

      const filename = `financial-repair-audit-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(response.data, filename);
      setSuccessMessage(`Exported ${response.data.meta.rowCount} repair audit row(s) to JSON.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export repair audit JSON.");
    } finally {
      setIsExporting(null);
    }
  }

  const rows = audit?.rows ?? [];
  const summary = audit?.summary;

  const columns = useMemo<DataTableColumn<FinancialRepairAuditRowDto>[]>(
    () => [
      {
        key: "createdAt",
        header: "Repair Time",
        cell: (row) => formatDateTime(row.createdAt),
      },
      {
        key: "item",
        header: "Item / Movement",
        cell: (row) => (
          <div>
            <p className="font-semibold text-foreground">{row.itemName}</p>
            <p className="text-xs text-muted-foreground">{row.movementId}</p>
          </div>
        ),
      },
      {
        key: "source",
        header: "Source",
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.sourceType}</p>
            <p className="text-xs text-muted-foreground">{row.sourceId ?? "-"}</p>
          </div>
        ),
      },
      {
        key: "snapshot",
        header: "Snapshot",
        cell: (row) => formatCurrency(row.unitCostSnapshot),
      },
      {
        key: "estimatedCost",
        header: "Repaired COGS",
        cell: (row) => formatCurrency(row.estimatedCost),
      },
      {
        key: "actor",
        header: "Actor",
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.actorName}</p>
            <p className="text-xs text-muted-foreground">{row.actorEmail ?? row.userId ?? "-"}</p>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div id="financial-repair-audit-trail">
      <DashboardPanel
        title="Repair Audit Trail"
        description="Audit stock movement cost snapshot repairs from Financial Reports. Export this trail when someone asks who changed COGS, because apparently databases do not speak in meetings."
        action={
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={() => void loadAudit()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </DashboardActionButton>
            <DashboardActionButton icon={Download} onClick={() => void handleExportCsv()} disabled={Boolean(isExporting)}>
              {isExporting === "csv" ? "Exporting..." : "Export CSV"}
            </DashboardActionButton>
            <DashboardActionButton icon={FileText} onClick={() => void handleExportJson()} disabled={Boolean(isExporting)}>
              {isExporting === "json" ? "Exporting..." : "Export JSON"}
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="space-y-4 p-4">
          {errorMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          )}

          <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Active audit range: <span className="font-semibold text-foreground">{periodContext.label}</span> · {periodContext.from} → {periodContext.to}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Audit Events"
              value={formatNumber(summary?.totalAuditEvents ?? 0)}
              description="Cost snapshot repair logs"
              icon={History}
              tone="blue"
            />
            <StatCard
              label="Repaired Movements"
              value={formatNumber(summary?.repairedMovementCount ?? 0)}
              description="Unique stock movements"
              icon={Wrench}
              tone="green"
            />
            <StatCard
              label="Repaired Value"
              value={formatCurrency(summary?.repairedValue ?? 0)}
              description="Estimated COGS restored"
              icon={ShieldCheck}
              tone="amber"
            />
            <StatCard
              label="Latest Repair"
              value={formatDateTime(summary?.latestRepairAt ?? null)}
              description={`${summary?.actorCount ?? 0} actor(s) involved`}
              icon={RefreshCw}
              tone="slate"
            />
          </div>

          <DataTable
            columns={columns}
            data={rows}
            getRowKey={(row) => row.auditId}
            minWidth={1120}
            emptyMessage={isLoading ? "Loading repair audit trail..." : "No repair audit rows found for this period."}
            pagination={{ pageSize: 8, label: "repair audit rows" }}
          />
        </div>
      </DashboardPanel>
    </div>
  );
}
