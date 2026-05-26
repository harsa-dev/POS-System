"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { TABLE_STATUS_COLORS } from "@/constants/table-status";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle, RefreshCw, Table2 } from "lucide-react";

type DiningTable = {
  id: string;
  name: string;
  capacity: number;
  status: string;
  isActive: boolean;
  createdAt: string;
};

export function TablesManager() {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);

  async function fetchTables() {
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await apiFetch("/api/tables", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setTables(data.data);
      } else {
        setFetchError(data.message || "Failed to load tables");
      }
    } catch {
      setFetchError("Network error — could not load tables");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = tableNumber.trim();
    if (!name) {
      toast.error("Table number is required");
      return;
    }

    setIsLoading(true);

    const res = await apiFetch("/api/tables", {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, capacity }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to create table");
      return;
    }

    setTableNumber("");
    setCapacity(2);
    fetchTables();
  }

  async function updateTable(
    id: string,
    body: Partial<{ name: string; capacity: number; isActive: boolean }>,
  ) {
    const res = await apiFetch(`/api/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!data.success) {
      toast.error(data.message || "Failed to update table");
      return;
    }

    fetchTables();
  }

  function deactivateTable(id: string) {
    setConfirmState({
      title: "Deactivate this table?",
      description:
        "The table will be hidden from the floor view and cannot accept new orders.",
      variant: "destructive",
      onConfirm: () => updateTable(id, { isActive: false }),
    });
  }

  function reactivateTable(id: string) {
    updateTable(id, { isActive: true });
  }

  function getStatusStyle(status: string) {
    return TABLE_STATUS_COLORS[status] ?? "bg-neutral-100 text-neutral-700";
  }

  useEffect(() => {
    fetchTables();
  }, []);

  return (
    <div className="space-y-6">
      {/* Add Table form */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold">Add Table</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            id="table-number"
            type="text"
            aria-label="Table number"
            placeholder="Table number, e.g. 1, 2, A1"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="h-11 rounded-2xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-400"
            required
          />

          <input
            id="table-capacity"
            type="number"
            min={1}
            aria-label="Seating capacity"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="h-11 rounded-2xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-400"
            required
          />
        </div>

        <button
          disabled={isLoading}
          className="flex h-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {isLoading ? "Creating..." : "Create Table"}
        </button>
      </form>

      {/* Tables list */}
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-lg font-bold">Dining Tables</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage table numbers and availability setup.
          </p>
        </div>

        {fetchError && (
          <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="flex-1 text-sm text-red-700">{fetchError}</p>
            <button
              type="button"
              onClick={fetchTables}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th scope="col" className="p-4 font-medium text-neutral-500">
                  Table Number
                </th>
                <th scope="col" className="p-4 font-medium text-neutral-500">Capacity</th>
                <th scope="col" className="p-4 font-medium text-neutral-500">
                  Current Status
                </th>
                <th scope="col" className="p-4 font-medium text-neutral-500">Active</th>
                <th scope="col" className="p-4 font-medium text-neutral-500">Created</th>
                <th scope="col" className="p-4 font-medium text-neutral-500">Action</th>
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="p-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {tables.map((table) => (
                    <tr
                      key={table.id}
                      className="border-b border-neutral-100 transition hover:bg-neutral-50"
                    >
                      <td className="p-4 font-medium">Table {table.name}</td>

                      <td className="p-4">{table.capacity} seats</td>

                      <td className="p-4">
                        <StatusBadge className={getStatusStyle(table.status)}>
                          {table.status}
                        </StatusBadge>
                      </td>

                      <td className="p-4">
                        <StatusBadge
                          className={
                            table.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {table.isActive ? "ACTIVE" : "INACTIVE"}
                        </StatusBadge>
                      </td>

                      <td className="p-4 text-neutral-500">
                        {new Date(table.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-4">
                        {table.isActive ? (
                          <button
                            type="button"
                            onClick={() => deactivateTable(table.id)}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => reactivateTable(table.id)}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {tables.length === 0 && !fetchError && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={Table2}
                          title="No tables yet"
                          description="Add your first table using the form above."
                        />
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ""}
        description={confirmState?.description}
        variant={confirmState?.variant}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          action?.();
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
