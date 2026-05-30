"use client";

import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

import { DashboardActionButton, DashboardActions, DashboardFilters, DashboardPanel, DashboardShell } from "@/features/shared/dashboard";
import { exportCsv } from "@/features/shared/export";
import { DateRangeFilter, SelectFilter, StatusFilter } from "@/features/shared/filters";
import { cashierShiftRows } from "./data/shift-mock";
import { ShiftKpis } from "./components/shift-analysis/shift-kpis";
import { ShiftList } from "./components/shift-list/shift-list";
import { ShiftDetailDrawer } from "./components/shift-detail-drawer";
import { getReadyToSyncShifts, markShiftsAsSynced } from "./services/shift-sync";
import type { CashierShift, ShiftFilters } from "@/features/shared/types";

const statusOptions = ["All", "Active", "Completed"];
const cashierOptions = ["All", "Cashier A", "Cashier B", "Cashier C"];
const warehouseOptions = ["All", "Warehouse 1", "Warehouse 2", "Warehouse 3"];

function countActiveFilters(filters: ShiftFilters) {
  return [
    filters.status !== "All",
    filters.cashier !== "All",
    filters.dateRange !== "This Month",
    filters.warehouse !== "All",
  ].filter(Boolean).length;
}

export function CashierShiftReportsDashboard() {
  const [shifts, setShifts] = useState<CashierShift[]>(cashierShiftRows);
  const [filters, setFilters] = useState<ShiftFilters>({
    status: "All",
    cashier: "All",
    dateRange: "This Month",
    warehouse: "Warehouse 1",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeShift, setActiveShift] = useState<CashierShift | null>(null);

  const readyToSyncShifts = useMemo(() => getReadyToSyncShifts(shifts), [shifts]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const statusMatches = filters.status === "All" || shift.status === filters.status;
      const cashierMatches =
        filters.cashier === "All" || shift.cashierName === filters.cashier;
      const warehouseMatches =
        filters.warehouse === "All" || shift.warehouse === filters.warehouse;

      return statusMatches && cashierMatches && warehouseMatches;
    });
  }, [filters, shifts]);

  function handleSyncToCashflow() {
    const readyIds = readyToSyncShifts.map((shift) => shift.id);
    setShifts((currentShifts) => markShiftsAsSynced(currentShifts, readyIds));
    setSelectedIds([]);
  }

  function handleDeleteSelected() {
    setShifts((currentShifts) =>
      currentShifts.filter((shift) => !selectedIds.includes(shift.id)),
    );
    setSelectedIds([]);
    setIsEditing(false);
  }

  return (
    <DashboardShell
      title="Cashier Shift Reports"
      description="Track cashier shifts, shift performance, cash discrepancies, and sync completed shifts into Cashflow."
    >
      <DashboardPanel>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 text-sm font-semibold text-neutral-600">
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              {countActiveFilters(filters)} Active Filters
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              {filters.warehouse === "All" ? "All Warehouses" : filters.warehouse}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {readyToSyncShifts.length} Shifts Ready To Sync
            </span>
          </div>
          <DashboardActions>
            <DashboardActionButton
              icon={RefreshCw}
              variant="primary"
              onClick={handleSyncToCashflow}
            >
              Sync To Cashflow
            </DashboardActionButton>
            <DashboardActionButton
              icon={Download}
              onClick={() =>
                exportCsv({
                  filename: "cashier-shift-reports",
                  rows: filteredShifts,
                  columns: [
                    { key: "cashier", header: "Cashier", value: (shift) => shift.cashierName },
                    { key: "status", header: "Status", value: (shift) => shift.status },
                    { key: "warehouse", header: "Warehouse", value: (shift) => shift.warehouse },
                    { key: "date", header: "Date", value: (shift) => shift.date },
                    { key: "sales", header: "Total Sales", value: (shift) => shift.totalSales },
                    { key: "cashDifference", header: "Cash Difference", value: (shift) => shift.cashDifference },
                    { key: "syncStatus", header: "Sync Status", value: (shift) => shift.syncStatus },
                  ],
                })
              }
            >
              Export
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </DashboardPanel>

      <ShiftKpis shifts={filteredShifts} />

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
                  cashier: cashier as ShiftFilters["cashier"],
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
              label="Warehouse"
              value={filters.warehouse}
              options={warehouseOptions}
              onChange={(warehouse) =>
                setFilters((current) => ({
                  ...current,
                  warehouse: warehouse as ShiftFilters["warehouse"],
                }))
              }
            />
          </DashboardFilters>
        </div>
      </DashboardPanel>

      <ShiftList
        shifts={filteredShifts}
        isEditing={isEditing}
        selectedIds={selectedIds}
        onEditChange={setIsEditing}
        onSelectionChange={setSelectedIds}
        onDeleteSelected={handleDeleteSelected}
        onOpenDetail={setActiveShift}
      />

      <ShiftDetailDrawer shift={activeShift} onClose={() => setActiveShift(null)} />
    </DashboardShell>
  );
}
