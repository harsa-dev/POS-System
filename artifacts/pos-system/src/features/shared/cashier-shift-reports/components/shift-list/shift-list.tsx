import { Edit, Trash2 } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type {
  CashierShift,
  CashReconciliationStatus,
  ShiftSyncStatus,
} from "@/features/shared/types";

type ShiftListProps = {
  shifts: CashierShift[];
  isEditing: boolean;
  selectedIds: string[];
  onEditChange: (isEditing: boolean) => void;
  onSelectionChange: (ids: string[]) => void;
  onDeleteSelected: () => void;
  onOpenDetail: (shift: CashierShift) => void;
};

function getCashStatusTone(status: CashReconciliationStatus) {
  if (status === "Cash Balanced") return "green";
  if (status === "Cash Over") return "amber";

  return "rose";
}

function getSyncStatusTone(status: ShiftSyncStatus) {
  if (status === "Synced") return "green";
  if (status === "Sync Failed") return "rose";

  return "slate";
}

function toggleSelected(selectedIds: string[], id: string) {
  return selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id];
}

export function ShiftList({
  shifts,
  isEditing,
  selectedIds,
  onEditChange,
  onSelectionChange,
  onDeleteSelected,
  onOpenDetail,
}: ShiftListProps) {
  const columns: DataTableColumn<CashierShift>[] = [
    ...(isEditing
      ? [
          {
            key: "selection",
            header: "",
            cell: (shift: CashierShift) => (
              <input
                type="checkbox"
                checked={selectedIds.includes(shift.id)}
                onChange={() =>
                  onSelectionChange(toggleSelected(selectedIds, shift.id))
                }
                className="h-4 w-4 rounded border-neutral-300"
              />
            ),
          } satisfies DataTableColumn<CashierShift>,
        ]
      : []),
    {
      key: "cashier",
      header: "Shift Item",
      cell: (shift) => (
        <button
          type="button"
          onClick={() => onOpenDetail(shift)}
          className="text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-neutral-950">
              {shift.cashierName}
            </span>
            <StatusPill tone={shift.status === "Active" ? "blue" : "green"}>
              {shift.status}
            </StatusPill>
            <StatusPill tone="slate">{shift.warehouse}</StatusPill>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            {shift.date} · {shift.startTime} - {shift.endTime ?? "Open"}
          </p>
        </button>
      ),
    },
    {
      key: "sales",
      header: "Sales",
      cell: (shift) => (
        <div>
          <p className="font-semibold text-neutral-950">
            {formatCurrency(shift.totalSales)}
          </p>
          <p className="text-sm text-neutral-500">
            {formatNumber(shift.transactionCount)} transactions
          </p>
        </div>
      ),
    },
    {
      key: "cashOut",
      header: "Cash Out",
      cell: (shift) => formatCurrency(shift.cashOut),
    },
    {
      key: "cashStatus",
      header: "Cash Status",
      cell: (shift) => (
        <StatusPill tone={getCashStatusTone(shift.cashStatus)}>
          {shift.cashStatus}
        </StatusPill>
      ),
    },
    {
      key: "syncStatus",
      header: "Sync Status",
      cell: (shift) => (
        <StatusPill tone={getSyncStatusTone(shift.syncStatus)}>
          {shift.syncStatus}
        </StatusPill>
      ),
    },
  ];

  return (
    <DashboardPanel
      title="Shift List"
      action={
        isEditing ? (
          <DashboardActions>
            <DashboardActionButton
              icon={Edit}
              onClick={() => onSelectionChange(shifts.map((shift) => shift.id))}
            >
              Select All
            </DashboardActionButton>
            <DashboardActionButton icon={Trash2} onClick={onDeleteSelected}>
              Delete
            </DashboardActionButton>
          </DashboardActions>
        ) : (
          <DashboardActionButton icon={Edit} onClick={() => onEditChange(true)}>
            Edit
          </DashboardActionButton>
        )
      }
    >
      <DataTable
        columns={columns}
        data={shifts}
        getRowKey={(shift) => shift.id}
        minWidth={980}
        emptyMessage="No shifts match the active filters."
      />
    </DashboardPanel>
  );
}
