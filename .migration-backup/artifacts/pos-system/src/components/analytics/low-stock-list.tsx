"use client";

import { useQuery } from "@tanstack/react-query";

import { AlertTriangle } from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
};

export function LowStockList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["low-stock"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/low-stock", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch low stock analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });

  const items: InventoryItem[] = data?.data ?? [];

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />

        <div>
          <h2 className="text-lg font-semibold">Low Stock Alert</h2>

          <p className="text-sm text-neutral-500">
            Inventory items running low
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading inventory alerts...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load low stock data.
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          All inventory stocks are healthy.
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-neutral-100 p-4 transition-colors hover:border-neutral-200"
            >
              <div>
                <p className="font-semibold">{item.name}</p>

                <p className="mt-1 text-sm text-neutral-500">Remaining stock</p>
              </div>

              <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                {item.currentStock} {item.unit}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
