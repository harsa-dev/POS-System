"use client";

import { useQuery } from "@tanstack/react-query";

import { Clock3, ReceiptText } from "lucide-react";

type LiveOrder = {
  id: string;
  orderNumber: number;
  status: string;
  table: string;
  elapsedMinutes: number;
};

export function LiveOrdersWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["live-orders"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/live-orders");

      if (!res.ok) {
        throw new Error("Failed to fetch live orders");
      }

      return res.json();
    },

    refetchInterval: 10000,

    staleTime: 5000,

    gcTime: 1000 * 60 * 2,
  });

  const orders: LiveOrder[] = data?.data ?? [];

  function getStatusColor(status: string) {
    switch (status) {
      case "PAID":
        return "bg-blue-100 text-blue-700";

      case "PREPARING":
        return "bg-orange-100 text-orange-700";

      case "READY":
        return "bg-green-100 text-green-700";

      default:
        return "bg-neutral-100 text-neutral-700";
    }
  }

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 flex items-center gap-2">
        <ReceiptText className="h-5 w-5 text-blue-500" />

        <div>
          <h2 className="text-lg font-semibold">Live Orders</h2>

          <p className="text-sm text-neutral-500">
            Active restaurant operations
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading live orders...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load live orders.
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          No active orders.
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-neutral-100 p-4 transition-colors hover:border-neutral-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">Order #{order.orderNumber}</p>

                  <p className="mt-1 text-sm text-neutral-500">{order.table}</p>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                    order.status,
                  )}`}
                >
                  {order.status}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                <Clock3 className="h-4 w-4" />
                Running for {order.elapsedMinutes}m
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
