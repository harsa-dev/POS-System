"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatOrderNumber } from "@/lib/utils/format";

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: string;
  type: "DINE_IN" | "TAKEAWAY";

  table?: {
    id: string;
    name: string;
    capacity: number;
    status: string;
  } | null;

  restaurant?: {
    timezone?: string;
    orderPrefix?: string;
  };

  items: {
    id: string;
    quantity: number;
    menuItem: {
      name: string;
    };
  }[];
};

type DiningTable = {
  id: string;
  name: string;
  capacity: number;
  status: string;
  isActive: boolean;
};

export function ServingBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cleaningTables, setCleaningTables] = useState<DiningTable[]>([]);

  async function fetchOrders() {
    const res = await fetch("/api/orders", { credentials: "include" });
    const data = await res.json();

    if (data.success) {
      setOrders(data.data.filter((order: Order) => order.status === "READY"));
    }
  }

  async function fetchTables() {
    const res = await fetch("/api/tables", { credentials: "include" });
    const data = await res.json();

    if (data.success) {
      setCleaningTables(
        data.data.filter(
          (table: DiningTable) => table.isActive && table.status === "CLEANING",
        ),
      );
    }
  }

  async function fetchData() {
    await Promise.all([fetchOrders(), fetchTables()]);
  }

  async function serveOrder(id: string) {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "SERVED",
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to serve order");
      return;
    }

    fetchData();
  }

  async function markTableClean(id: string) {
    const res = await fetch(`/api/tables/${id}/mark-clean`, {
      method: "PATCH",
      credentials: "include",
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to mark table clean");
      return;
    }

    fetchData();
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {cleaningTables.length > 0 && (
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="border-b pb-3">
            <h2 className="font-semibold">Tables Need Cleaning</h2>

            <p className="mt-1 text-sm text-neutral-500">
              Mark tables as available after cleaning.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cleaningTables.map((table) => (
              <div
                key={table.id}
                className="rounded-xl border bg-yellow-50 p-4"
              >
                <p className="text-sm text-neutral-500">Table</p>

                <p className="mt-1 text-2xl font-bold">{table.name}</p>

                <p className="mt-1 text-xs text-neutral-500">
                  Capacity: {table.capacity} seats
                </p>

                <button
                  type="button"
                  onClick={() => markTableClean(table.id)}
                  className="mt-4 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white"
                >
                  Mark Clean
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="border-b pb-3">
          <h2 className="font-semibold">Ready Orders</h2>

          <p className="mt-1 text-sm text-neutral-500">
            Orders ready to be served.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const timezone = order.restaurant?.timezone ?? "Asia/Makassar";
            const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
            const isDineIn = order.type === "DINE_IN";

            return (
              <div
                key={order.id}
                className="rounded-xl border bg-neutral-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-neutral-500">Order</p>

                    <p className="mt-1 text-xl font-bold">
                      {formatOrderNumber(order.orderNumber, orderPrefix)}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {order.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-neutral-500">
                  <p>{formatDateTime(order.createdAt, timezone)}</p>

                  <p>{isDineIn ? "Dine In" : "Takeaway"}</p>

                  {isDineIn && order.table && (
                    <p className="font-semibold text-neutral-700">
                      Table {order.table.name}
                    </p>
                  )}

                  {isDineIn && !order.table && (
                    <p className="font-semibold text-red-600">Table missing</p>
                  )}
                </div>

                {isDineIn && order.table && (
                  <div className="mt-4 rounded-xl border bg-white p-3">
                    <p className="text-sm text-neutral-500">Serve to</p>

                    <p className="mt-1 text-2xl font-bold">
                      Table {order.table.name}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Capacity: {order.table.capacity} seats
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-white p-3 text-sm"
                    >
                      <span className="font-medium">{item.menuItem.name}</span>

                      <span className="font-bold">× {item.quantity}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => serveOrder(order.id)}
                  className="mt-4 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white"
                >
                  Mark as Served
                </button>
              </div>
            );
          })}

          {orders.length === 0 && (
            <div className="rounded-xl border border-dashed bg-neutral-50 p-6 text-center text-sm text-neutral-500 sm:col-span-2 lg:col-span-3">
              No ready orders.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}