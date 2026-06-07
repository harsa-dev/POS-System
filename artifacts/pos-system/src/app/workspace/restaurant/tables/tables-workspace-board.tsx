import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  Loader2,
  PackageCheck,
  Search,
  Table2,
  Users,
} from "lucide-react";

import type {
  TablesWorkspaceStatus,
  TablesWorkspaceTable,
} from "./use-tables-workspace-tables";

type TablesWorkspaceFilter = "all" | "available" | "occupied" | "cleaning";

type TablesWorkspaceBoardProps = {
  tables: TablesWorkspaceTable[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  updatingTableId: string | null;
  onMarkClean: (table: TablesWorkspaceTable) => Promise<void>;
};

const filters: Array<{ id: TablesWorkspaceFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "occupied", label: "Occupied" },
  { id: "cleaning", label: "Cleaning" },
];

const statusTone: Record<TablesWorkspaceStatus, string> = {
  AVAILABLE: "bg-green-50 text-green-700",
  OCCUPIED: "bg-red-50 text-red-700",
  CLEANING: "bg-yellow-50 text-yellow-700",
  RESERVED: "bg-blue-50 text-blue-700",
  INACTIVE: "bg-neutral-100 text-neutral-500",
  UNKNOWN: "bg-neutral-100 text-neutral-700",
};

function matchesFilter(
  table: TablesWorkspaceTable,
  filter: TablesWorkspaceFilter,
) {
  if (filter === "all") return true;
  if (filter === "available") return table.status === "AVAILABLE";
  if (filter === "occupied") return table.status === "OCCUPIED";
  return table.status === "CLEANING";
}

function TablesWorkspaceSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading tables" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="h-24 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-3 w-20 rounded bg-neutral-100" />
            <div className="mt-3 h-8 w-12 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="h-52 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-5 w-24 rounded bg-neutral-200" />
            <div className="mt-4 h-20 rounded-xl bg-neutral-50" />
            <div className="mt-4 h-10 rounded-xl bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TablesSummary({ tables }: { tables: TablesWorkspaceTable[] }) {
  const availableCount = tables.filter(
    (table) => table.status === "AVAILABLE",
  ).length;
  const occupiedCount = tables.filter((table) => table.status === "OCCUPIED")
    .length;
  const cleaningCount = tables.filter((table) => table.status === "CLEANING")
    .length;
  const reservedCount = tables.filter((table) => table.status === "RESERVED")
    .length;

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Total
        </p>
        <p className="mt-2 text-2xl font-bold text-neutral-950">
          {tables.length}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Available
        </p>
        <p className="mt-2 text-2xl font-bold text-green-700">
          {availableCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Occupied
        </p>
        <p className="mt-2 text-2xl font-bold text-red-700">
          {occupiedCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Cleaning
        </p>
        <p className="mt-2 text-2xl font-bold text-yellow-700">
          {cleaningCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Reserved
        </p>
        <p className="mt-2 text-2xl font-bold text-blue-700">
          {reservedCount}
        </p>
      </div>
    </div>
  );
}

function TablesWorkspaceCard({
  table,
  isUpdating,
  onMarkClean,
}: {
  table: TablesWorkspaceTable;
  isUpdating: boolean;
  onMarkClean: (table: TablesWorkspaceTable) => Promise<void>;
}) {
  const isCleaning = table.status === "CLEANING";

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Table
          </p>
          <h2 className="mt-1 text-xl font-bold text-neutral-950">
            {table.name}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[table.status]}`}
        >
          {table.statusLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-neutral-500">
            <Users className="h-4 w-4" aria-hidden="true" />
            Capacity
          </span>
          <span className="font-bold text-neutral-800">
            {table.capacity} seats
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-neutral-500">
            <Table2 className="h-4 w-4" aria-hidden="true" />
            Availability
          </span>
          <span className="font-bold text-neutral-800">
            {table.activeLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-4">
        {isCleaning ? (
          <button
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUpdating}
            onClick={() => void onMarkClean(table)}
            type="button"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Marking clean...
              </>
            ) : (
              "Mark Clean"
            )}
          </button>
        ) : (
          <button
            className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-500 disabled:cursor-not-allowed disabled:opacity-70"
            disabled
            type="button"
          >
            Table action - not wired yet
          </button>
        )}
      </div>
    </article>
  );
}

export function TablesWorkspaceBoard({
  tables,
  status,
  errorMessage,
  updatingTableId,
  onMarkClean,
}: TablesWorkspaceBoardProps) {
  const [activeFilter, setActiveFilter] =
    useState<TablesWorkspaceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTables = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tables.filter((table) => {
      const matchesLifecycleFilter = matchesFilter(table, activeFilter);
      const searchableText = [
        table.name,
        table.statusLabel,
        table.activeLabel,
        String(table.capacity),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesLifecycleFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery, tables]);

  if (status === "loading") {
    return <TablesWorkspaceSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-4 font-bold text-red-700">Failed to load tables</p>
        <p className="mt-2 text-sm text-red-600">
          {errorMessage ?? "Please check the connection and try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TablesSummary tables={tables} />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-950">
              Table Lifecycle
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Read-only V3 table visibility across available, occupied, and
              cleaning states.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500 lg:w-72">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              aria-label="Search V3 tables"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tables..."
              value={searchQuery}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                activeFilter === filter.id
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <PackageCheck className="h-4 w-4 text-neutral-500" aria-hidden="true" />
        Mark clean is enabled only for cleaning tables. Other table actions are
        placeholders.
      </div>

      {filteredTables.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            {tables.length === 0 ? (
              <Table2 className="h-7 w-7" aria-hidden="true" />
            ) : (
              <CheckCheck className="h-7 w-7" aria-hidden="true" />
            )}
          </div>
          <p className="mt-4 text-lg font-bold text-neutral-800">
            {tables.length === 0 ? "No tables yet" : "No matching tables"}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {tables.length === 0
              ? "Tables created in the current F&B route will appear here."
              : "Try changing the lifecycle filter or search term."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredTables.map((table) => (
            <TablesWorkspaceCard
              isUpdating={updatingTableId === table.id}
              key={table.id}
              onMarkClean={onMarkClean}
              table={table}
            />
          ))}
        </div>
      )}
    </div>
  );
}
