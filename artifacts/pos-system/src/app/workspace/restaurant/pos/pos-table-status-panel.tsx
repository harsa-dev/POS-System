import { Table2 } from "lucide-react";

import type {
  PosTableItem,
  PosTableSummary,
} from "./pos-workspace-types";

type PosTableStatusPanelProps = {
  tables: PosTableItem[];
  summary: PosTableSummary;
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  isUsingFallback: boolean;
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
};

const tableSummaryItems = [
  { key: "available", label: "Available", className: "bg-green-50 text-green-700" },
  { key: "occupied", label: "Occupied", className: "bg-red-50 text-red-700" },
  { key: "reserved", label: "Reserved", className: "bg-blue-50 text-blue-700" },
  { key: "cleaning", label: "Cleaning", className: "bg-yellow-50 text-yellow-700" },
] as const;

function getTableStatusClassName(status: string) {
  if (status === "AVAILABLE") return "bg-green-100 text-green-700";
  if (status === "OCCUPIED") return "bg-red-100 text-red-700";
  if (status === "RESERVED") return "bg-blue-100 text-blue-700";
  if (status === "CLEANING") return "bg-yellow-100 text-yellow-700";
  return "bg-neutral-100 text-neutral-700";
}

function formatTableStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function PosTableStatusPanel({
  tables,
  summary,
  status,
  errorMessage,
  isUsingFallback,
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
            {isUsingFallback
              ? "Static preview table data"
              : "Read-only floor snapshot"}
          </p>
        </div>
        <Table2 className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-neutral-950 p-3 text-white">
          <p className="text-xs font-medium text-white/70">Total</p>
          <p className="mt-1 text-xl font-bold">{summary.total}</p>
        </div>
        {tableSummaryItems.map((item) => (
          <div className={`rounded-2xl p-3 ${item.className}`} key={item.key}>
            <p className="text-xs font-medium opacity-80">{item.label}</p>
            <p className="mt-1 text-xl font-bold">{summary[item.key]}</p>
          </div>
        ))}
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
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isSelected
                      ? "bg-white/15 text-white"
                      : getTableStatusClassName(table.status)
                  }`}
                >
                  {formatTableStatus(table.status)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
