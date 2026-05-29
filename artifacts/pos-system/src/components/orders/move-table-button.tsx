"use client";

import { useEffect, useState } from "react";
import { orderApi, tablesApi } from "@/lib/api";
import { toast } from "sonner";

type DiningTable = {
  id: string;
  name: string;
  capacity: number;
  status: string;
  isActive: boolean;
};

type MoveTableButtonProps = {
  orderId: string;
};

export function MoveTableButton({ orderId }: MoveTableButtonProps) {
  const [open, setOpen] = useState(false);

  const [tables, setTables] = useState<DiningTable[]>([]);

  const [selectedTableId, setSelectedTableId] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  async function fetchTables() {
    const data = await tablesApi.list<DiningTable[]>();

    if (data.success) {
      setTables(
        (data.data ?? []).filter(
          (table: DiningTable) =>
            table.isActive && table.status === "AVAILABLE",
        ),
      );
    }
  }

  async function moveTable() {
    if (!selectedTableId) {
      toast.warning("Please select a table");
      return;
    }

    setIsLoading(true);

    const data = await orderApi.moveTable(orderId, { tableId: selectedTableId });
    setIsLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to move table");
      return;
    }

    toast.success("Table moved successfully");
    window.location.reload();
  }

  useEffect(() => {
    if (open) {
      fetchTables();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border py-3 font-medium transition hover:bg-neutral-50"
      >
        Move Table
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Move Table</h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Select available table.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full rounded-xl border px-4 py-3"
              >
                <option value="">Select table</option>

                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Table {table.name} • {table.capacity} seats
                  </option>
                ))}
              </select>

              {tables.length === 0 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
                  No available tables.
                </div>
              )}

              <button
                type="button"
                onClick={moveTable}
                disabled={isLoading || !selectedTableId}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? "Moving..." : "Confirm Move"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
