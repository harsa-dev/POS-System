"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

import { DashboardActionButton, DashboardActions, DashboardFilters, DashboardPanel, DashboardShell } from "@/features/shared/dashboard";
import { DateRangeFilter, SelectFilter, StatusFilter } from "@/features/shared/filters";
import { ShiftKpis } from "./components/shift-analysis/shift-kpis";
import { ShiftList } from "./components/shift-list/shift-list";
import { ShiftDetailDrawer } from "./components/shift-detail-drawer";
import type { CashierShift, ShiftFilters } from "@/features/shared/types";
import { cashflowApi } from "@/lib/api/cashflow-api";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  shiftsApi,
  type ApiShiftDto,
  type ApiShiftOrderDto,
  type CashierShiftReportQuery,
} from "@/lib/api/shifts-api";

const statusOptions = ["All", "Active", "Completed"];

function countActiveFilters(filters: ShiftFilters) {
  return [
    filters.status !== "All",
    filters.cashier !== "All",
    filters.dateRange !== "This Month",
    filters.warehouse !== "All",
  ].filter(Boolean).length;
}

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

function buildReportQuery(filters: ShiftFilters): CashierShiftReportQuery {
  return {
    status: filters.status,
    cashier: filters.cashier,
    dateRange: filters.dateRange,
    limit: 500,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return undefined;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCashStatus(cashDifference: number) {
  if (cashDifference === 0) return "Cash Balanced";
  if (cashDifference > 0) return "Cash Over";
  return "Cash Short";
}

function isOrderCountedInShiftSales(order: ApiShiftOrderDto) {
  return order.status !== "CANCELLED" && order.status !== "PENDING_PAYMENT";
}

function getReportCashStatus(shift: ApiShiftDto, cashDifference: number): CashierShift["cashStatus"] {
  return (shift.report?.cashStatus as CashierShift["cashStatus"] | undefined) ?? getCashStatus(cashDifference);
}

function mapApiShiftToCashierShift(shift: ApiShiftDto, failedSyncIds: Set<string>): CashierShift {
  const orders = shift.orders ?? [];
  const countedOrders = orders.filter(isOrderCountedInShiftSales);
  const totalSales = shift.report?.totalSales ?? countedOrders.reduce((total, order) => total + order.total, 0);
  const cashDifference = shift.report?.cashDifference ?? shift.cashDifference ?? 0;
  const isClosed = shift.status === "CLOSED";

  return {
    id: shift.id,
    cashierName: shift.report?.cashierName ?? shift.user?.name ?? shift.user?.email ?? "Unknown Cashier",
    status: isClosed ? "Completed" : "Active",
    warehouse: shift.report?.businessScope ?? "Current Business",
    date: formatDate(shift.openedAt),
    startTime: formatTime(shift.openedAt) ?? "-",
    endTime: formatTime(shift.closedAt),
    totalSales,
    transactionCount: shift.report?.transactionCount ?? countedOrders.length,
    cashOut: shift.report?.cashOut ?? Math.max(0, -cashDifference),
    startingCash: shift.openingCash,
    endingCash: shift.report?.endingCash ?? shift.closingCash ?? shift.expectedCash,
    cashDifference,
    cashStatus: getReportCashStatus(shift, cashDifference),
    syncStatus: failedSyncIds.has(shift.id)
      ? "Sync Failed"
      : shift.cashflowSynced
        ? "Synced"
        : "Not Synced",
  };
}

export function CashierShiftReportsDashboard() {
  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [knownCashiers, setKnownCashiers] = useState<string[]>([]);
  const [failedSyncIds, setFailedSyncIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ShiftFilters>({
    status: "All",
    cashier: "All",
    dateRange: "This Month",
    warehouse: "All",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeShift, setActiveShift] = useState<CashierShift | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reportQuery = useMemo(() => buildReportQuery(filters), [filters]);

  const loadShifts = useCallback(async () => {
    setIsFetching(true);
    setMessage(null);

    try {
      const response = await shiftsApi.listReports(reportQuery);
      const mappedShifts = response.data.rows.map((shift) => mapApiShiftToCashierShift(shift, failedSyncIds));
      setShifts(mappedShifts);
      setKnownCashiers((current) =>
        Array.from(new Set([...current, ...mappedShifts.map((shift) => shift.cashierName)])).sort(),
      );
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to load cashier shift reports."));
    } finally {
      setIsFetching(false);
    }
  }, [failedSyncIds, reportQuery]);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  const backendFilteredShifts = useMemo(() => {
    if (filters.warehouse === "All") return shifts;
    return shifts.filter((shift) => shift.warehouse === filters.warehouse);
  }, [filters.warehouse, shifts]);

  const readyToSyncShifts = useMemo(
    () => backendFilteredShifts.filter((shift) => shift.status === "Completed" && shift.syncStatus !== "Synced"),
    [backendFilteredShifts],
  );

  const cashierOptions = useMemo(
    () => ["All", ...knownCashiers],
    [knownCashiers],
  );

  const warehouseOptions = useMemo(
    () => ["All", ...Array.from(new Set(shifts.map((shift) => shift.warehouse)))],
    [shifts],
  );

  async function handleSyncToCashflow(ids?: string[]) {
    const targetIds = ids?.length ? ids : readyToSyncShifts.map((shift) => shift.id);
    const eligibleIds = targetIds.filter((id) =>
      readyToSyncShifts.some((shift) => shift.id === id),
    );

    if (eligibleIds.length === 0) {
      setMessage("No completed unsynced shifts are ready for cashflow sync.");
      return;
    }

    setIsSyncing(true);
    setMessage(null);

    const failedIds: string[] = [];

    for (const shiftId of eligibleIds) {
      try {
        await cashflowApi.syncShift(shiftId);
      } catch {
        failedIds.push(shiftId);
      }
    }

    setFailedSyncIds(new Set(failedIds));
    setSelectedIds([]);
    setIsEditing(false);
    setMessage(
      failedIds.length > 0
        ? `${eligibleIds.length - failedIds.length} shift(s) synced, ${failedIds.length} failed.`
        : `${eligibleIds.length} shift(s) synced to cashflow.`,
    );
    setIsSyncing(false);
    await loadShifts();
  }

  async function handleExport() {
    setIsExporting(true);
    setMessage(null);

    try {
      const download = await shiftsApi.downloadReportsCsv(reportQuery);
      downloadBlob(download.blob, download.filename);
      setMessage(`Exported ${download.rowCount ?? "all"} cashier shift report row(s).`);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to export cashier shift reports."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DashboardShell
      title="Cashier Shift Reports"
      description="Track cashier shifts, shift performance, cash discrepancies, and sync completed shifts into Cashflow. Table, KPI, and export data are loaded from the backend report endpoint."
    >
      <DashboardPanel>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 text-sm font-semibold text-neutral-600">
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              {countActiveFilters(filters)} Active Filters
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              {filters.warehouse === "All" ? "All Business Scopes" : filters.warehouse}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              {backendFilteredShifts.length} Backend Report Row(s)
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {readyToSyncShifts.length} Shifts Ready To Sync
            </span>
            {message && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                {message}
              </span>
            )}
          </div>
          <DashboardActions>
            <DashboardActionButton
              icon={RefreshCw}
              variant="primary"
              disabled={isFetching || isSyncing || readyToSyncShifts.length === 0}
              onClick={() => void handleSyncToCashflow()}
            >
              {isSyncing ? "Syncing..." : "Sync To Cashflow"}
            </DashboardActionButton>
            <DashboardActionButton
              icon={Download}
              disabled={isExporting || isFetching}
              onClick={() => void handleExport()}
            >
              {isExporting ? "Exporting..." : "Export"}
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </DashboardPanel>

      <ShiftKpis shifts={backendFilteredShifts} />

      <DashboardPanel title="Filters">
        <div className="p-4">
          <DashboardFilters className="md:grid-cols-4">
            <StatusFilter
              value={filters.status}
              options={statusOptions}
              onChange={(status) =>
                setFilters((current) => ({
                  ...current,
                  status: status as ShiftFilters["status"],
                }))
              }
            />
            <SelectFilter
              label="Cashier"
              value={filters.cashier}
              options={cashierOptions}
              onChange={(cashier) =>
                setFilters((current) => ({
                  ...current,
                  cashier,
                }))
              }
            />
            <DateRangeFilter
              value={filters.dateRange}
              onChange={(dateRange) =>
                setFilters((current) => ({ ...current, dateRange }))
              }
            />
            <SelectFilter
              label="Business Scope"
              value={filters.warehouse}
              options={warehouseOptions}
              onChange={(warehouse) =>
                setFilters((current) => ({
                  ...current,
                  warehouse,
                }))
              }
            />
          </DashboardFilters>
        </div>
      </DashboardPanel>

      <ShiftList
        shifts={backendFilteredShifts}
        isEditing={isEditing}
        selectedIds={selectedIds}
        onEditChange={setIsEditing}
        onSelectionChange={setSelectedIds}
        onSyncSelected={() => void handleSyncToCashflow(selectedIds)}
        onOpenDetail={setActiveShift}
      />

      <ShiftDetailDrawer shift={activeShift} onClose={() => setActiveShift(null)} />
    </DashboardShell>
  );
}
