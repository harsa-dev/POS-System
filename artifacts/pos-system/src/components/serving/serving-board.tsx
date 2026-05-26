"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { CheckCheck, Loader2, ShoppingBag, Sparkles } from "lucide-react";
import { formatDateTime, formatOrderNumber } from "@/lib/utils/format";
import { useRealtime } from "@/lib/use-realtime";
import { ConnectionStatusBadge } from "@/components/ui/connection-status";
import { playBeep } from "@/lib/beep";

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: string;
  type: "DINE_IN" | "TAKEAWAY";
  table?: { id: string; name: string; capacity: number; status: string } | null;
  restaurant?: { timezone?: string; orderPrefix?: string };
  items: { id: string; quantity: number; menuItem: { name: string } }[];
};

type DiningTable = {
  id: string;
  name: string;
  capacity: number;
  status: string;
  isActive: boolean;
};

function ServingSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading serving board" aria-busy="true">
      <div>
        <div className="h-7 w-40 rounded-lg bg-neutral-200 animate-pulse" />
        <div className="mt-1.5 h-4 w-64 rounded bg-neutral-100 animate-pulse" />
      </div>
      <section className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse">
        <div className="border-b pb-3">
          <div className="h-5 w-32 rounded bg-neutral-200" />
          <div className="mt-2 h-4 w-52 rounded bg-neutral-100" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-neutral-50 p-4 space-y-2">
              <div className="h-4 w-16 rounded bg-neutral-200" />
              <div className="h-8 w-20 rounded bg-neutral-200" />
              <div className="h-10 w-full rounded-xl bg-neutral-200 mt-3" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ServingBoard() {
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["serving-orders"],
    queryFn: async () => {
      const res = await apiFetch("/api/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    // SSE drives updates; polling is a 60 s safety fallback
    refetchInterval: 60_000,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ["serving-tables"],
    queryFn: async () => {
      const res = await apiFetch("/api/tables", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tables");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const { status: realtimeStatus } = useRealtime({
    invalidateKeys: [["serving-orders"], ["serving-tables"]],
    onOrderUpdated: (event) => {
      if (event.status === "READY") {
        playBeep(660, 200, 0.2);
        toast("✅ Order ready to serve", {
          description: `Order #${event.orderNumber} is ready for delivery`,
          duration: 5000,
        });
      }
    },
  });

  const serveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SERVED" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to serve order");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serving-orders"] });
      queryClient.invalidateQueries({ queryKey: ["serving-tables"] });
      toast.success("Order marked as served");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to serve order"),
  });

  const cleanMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/tables/${id}/mark-clean`, {
        method: "PATCH",
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to mark table clean");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serving-tables"] });
      toast.success("Table marked as available");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update table"),
  });

  const orders: Order[] = (ordersData?.data ?? []).filter((o: Order) => o.status === "READY");
  const cleaningTables: DiningTable[] = (tablesData?.data ?? []).filter(
    (t: DiningTable) => t.isActive && t.status === "CLEANING",
  );

  if (ordersLoading || tablesLoading) return <ServingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Serving Board</h1>
          <p className="mt-1 text-sm text-neutral-500">Deliver ready orders and manage table turnover</p>
        </div>
        <ConnectionStatusBadge status={realtimeStatus} className="mt-1 shrink-0" />
      </div>

      <AnimatePresence>
        {cleaningTables.length > 0 && (
          <motion.section
            key="cleaning"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm"
          >
            <div className="border-b border-yellow-200 pb-3">
              <h2 className="font-semibold text-yellow-800">Tables Need Cleaning</h2>
              <p className="mt-1 text-sm text-yellow-600">Mark as available after cleaning.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cleaningTables.map((table) => {
                const isCleaning = cleanMutation.isPending && cleanMutation.variables === table.id;
                return (
                  <motion.div
                    key={table.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="rounded-xl border border-yellow-200 bg-white p-4"
                  >
                    <p className="text-xs text-neutral-500">Table</p>
                    <p className="mt-1 text-2xl font-bold">{table.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{table.capacity} seats</p>
                    <button
                      type="button"
                      disabled={isCleaning}
                      onClick={() => cleanMutation.mutate(table.id)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isCleaning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span className="sr-only">Marking table as clean…</span>
                        </>
                      ) : "Mark Clean"}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="border-b pb-3">
          <h2 className="font-semibold">Ready Orders</h2>
          <p className="mt-1 text-sm text-neutral-500">Orders ready to be served to customers.</p>
        </div>
        <div className="mt-4">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 py-14 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
                <CheckCheck className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="mt-4 font-semibold text-neutral-700">No ready orders</p>
              <p className="mt-1 text-sm text-neutral-400">Orders marked ready from the kitchen will appear here.</p>
            </motion.div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {orders.map((order) => {
                  const timezone = order.restaurant?.timezone ?? "Asia/Makassar";
                  const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
                  const isDineIn = order.type === "DINE_IN";
                  const isServing = serveMutation.isPending && serveMutation.variables === order.id;

                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="rounded-xl border border-green-200 bg-green-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-neutral-500">Order</p>
                          <p className="mt-0.5 text-xl font-bold">
                            {formatOrderNumber(order.orderNumber, orderPrefix)}
                          </p>
                        </div>
                        <span className="rounded-full bg-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          Ready
                        </span>
                      </div>

                      <div className="mt-2 space-y-0.5 text-xs text-neutral-500">
                        <p>{formatDateTime(order.createdAt, timezone)}</p>
                        <p className="flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" aria-hidden="true" />
                          {isDineIn ? "Dine In" : "Takeaway"}
                        </p>
                        {isDineIn && order.table && (
                          <p className="font-semibold text-neutral-700">Table {order.table.name}</p>
                        )}
                        {isDineIn && !order.table && (
                          <p className="font-semibold text-red-600">Table missing</p>
                        )}
                      </div>

                      {isDineIn && order.table && (
                        <div className="mt-3 rounded-xl border border-green-200 bg-white p-3">
                          <p className="text-xs text-neutral-500">Deliver to</p>
                          <p className="mt-0.5 text-2xl font-bold">Table {order.table.name}</p>
                          <p className="text-xs text-neutral-500">{order.table.capacity} seats</p>
                        </div>
                      )}

                      <div className="mt-3 space-y-1.5">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                          >
                            <span className="font-medium">{item.menuItem.name}</span>
                            <span className="font-bold text-neutral-500">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={isServing}
                        onClick={() => serveMutation.mutate(order.id)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isServing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            <span className="sr-only">Marking as served…</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            Mark as Served
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
