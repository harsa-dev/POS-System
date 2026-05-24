"use client";

import { useEffect, useState } from "react";
import { TABLE_STATUS_COLORS } from "@/constants/table-status";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);

  async function fetchTables() {
    const res = await fetch("/api/tables", { credentials: "include" });
    const data = await res.json();

    if (data.success) {
      setTables(data.data);
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

    const res = await fetch("/api/tables", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        capacity,
      }),
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
    body: Partial<{
      name: string;
      capacity: number;
      isActive: boolean;
    }>,
  ) {
    const res = await fetch(`/api/tables/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
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
      description: "The table will be hidden from the floor view and cannot accept new orders.",
      variant: "destructive",
      onConfirm: () => updateTable(id, { isActive: false }),
    });
  }

  async function reactivateTable(id: string) {
    await updateTable(id, {
      isActive: true,
    });
  }

  function getStatusStyle(status: string) {
    return TABLE_STATUS_COLORS[status] ?? "bg-neutral-100 text-neutral-700";
  }

  useEffect(() => {
    fetchTables();
  }, []);

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-2xl border bg-white p-5"
      >
        <h2 className="text-lg font-bold">Add Table</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Table number, e.g. 1, 2, A1"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="rounded-xl border px-3 py-2"
            required
          />

          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="rounded-xl border px-3 py-2"
            required
          />
        </div>

        <button
          disabled={isLoading}
          className="rounded-xl bg-black py-3 text-white disabled:opacity-60"
        >
          {isLoading ? "Creating..." : "Create Table"}
        </button>
      </form>

      <div className="rounded-2xl border bg-white">
        <div className="border-b p-5">
          <h2 className="text-lg font-bold">Dining Tables</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage table numbers and availability setup.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b bg-neutral-50">
                <th className="p-4">Table Number</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Active</th>
                <th className="p-4">Created</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {tables.map((table) => (
                <tr key={table.id} className="border-b">
                  <td className="p-4 font-medium">Table {table.name}</td>

                  <td className="p-4">{table.capacity} seats</td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        table.status,
                      )}`}
                    >
                      {table.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        table.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {table.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>

                  <td className="p-4 text-neutral-500">
                    {new Date(table.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    {table.isActive ? (
                      <button
                        type="button"
                        onClick={() => deactivateTable(table.id)}
                        className="rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reactivateTable(table.id)}
                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {tables.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    No tables yet.
                  </td>
                </tr>
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
