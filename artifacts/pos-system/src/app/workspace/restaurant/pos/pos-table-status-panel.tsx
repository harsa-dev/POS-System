import { Table2 } from "lucide-react";

import type {
  PosTableItem,
  PosTableSummary,
} from "./pos-workspace-types";
import {
  normalizeRestaurantTableStatus,
  restaurantTableStatusLabels,
  restaurantTableStatusTones,
  type RestaurantTableStatus,
} from "@/app/workspace/restaurant/shared/restaurant-workspace-status";
import {
  InlineErrorNotice,
  StatusBadge,
} from "@/app/workspace/restaurant/shared/workspace-feedback";

type PosTableStatusPanelProps = {
  tables: PosTableItem[];
  summary: PosTableSummary;
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  isUsingFallback: boolean;
  isRefreshing: boolean;
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
};

type TableSummaryKey = Exclude<keyof PosTableSummary, "total">;

const tableSummaryItems: Array<{
  key: TableSummaryKey;
  status: RestaurantTableStatus;
}> = [
  { key: "available", status: "AVAILABLE" },
  { key: "occupied", status: "OCCUPIED" },
  { key: "reserved", status: "RESERVED" },
  { key: "cleaning", status: "CLEANING" },
] as const;

export function PosTableStatusPanel({
  tables,
  summary,
  status,
  errorMessage,
  isUsingFallback,
  isRefreshing,
  selectedTableId,
  onSelectTable,
}: PosTableStatusPanelProps) {
  const isLoading = status === "loading";

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Table Status</h3>
          <p className="mt-1 text-xs text-neutral-500">
            {isRefreshing
              ? "Refreshing floor snapshot..."
              : isUsingFallback
                ? "Static preview table data"
                : "Read-only floor snapshot"}
          </p>
        </div>
        <Table2 className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>

      {errorMessage ? (
        <InlineErrorNotice className="mt-4 p-3 text-xs leading-5">
          {errorMessage}
        </InlineErrorNotice>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-neutral-950 p-3 text-white">
          <p className="text-xs font-medium text-white/70">Total</p>
          <p className="mt-1 text-xl font-bold">{summary.total}</p>
        </div>
        {tableSummaryItems.map((item) => {
          return (
            <div
              className={`rounded-2xl p-3 ${restaurantTableStatusTones[item.status]}`}
              key={item.key}
            >
              <p className="text-xs font-medium opacity-80">
                {restaurantTableStatusLabels[item.status]}
              </p>
              <p className="mt-1 text-xl font-bold">{summary[item.key]}</p>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-12 animate-pulse rounded-2xl bg-neutral-100"
              key={index}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && tables.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">
          No active tables are available for this workspace preview.
        </div>
      ) : null}

      {!isLoading && tables.length > 0 ? (
        <div className="mt-4 space-y-2">
          <button
            aria-pressed={selectedTableId === null}
            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition hover:border-neutral-300 ${
              selectedTableId === null
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700"
            }`}
            onClick={() => onSelectTable(null)}
            type="button"
          >
            <span>No table selected</span>
            <span className="text-xs font-semibold opacity-70">Local</span>
          </button>

          {tables.slice(0, 6).map((table) => {
            const isSelected = selectedTableId === table.id;
            const tableStatus = normalizeRestaurantTableStatus(table.status);

            return (
              <button
                aria-pressed={isSelected}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition hover:border-neutral-300 ${
                  isSelected
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-700"
                }`}
                key={table.id}
                onClick={() => onSelectTable(table.id)}
                type="button"
              >
                <span>
                  {table.name}
                  <span className="ml-2 text-xs font-medium opacity-60">
                    {table.capacity} seats
                  </span>
                </span>
                <StatusBadge
                  className="px-2 py-0.5"
                  tone={
                    isSelected
                      ? "bg-white/15 text-white"
                      : restaurantTableStatusTones[tableStatus]
                  }
                >
                  {restaurantTableStatusLabels[tableStatus]}
                </StatusBadge>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
