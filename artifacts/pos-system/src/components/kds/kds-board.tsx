"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChefHat, Clock, Loader2, UtensilsCrossed } from "lucide-react";
import { formatDateTime, formatOrderNumber } from "@/lib/utils/format";
import { useRealtime } from "@/lib/use-realtime";
import { ConnectionStatusBadge } from "@/components/ui/connection-status";
import { playNewOrderChime } from "@/lib/beep";

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

const KITCHEN_STATUSES = ["PAID", "PREPARING"];

function KDSSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading kitchen orders" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm animate-pulse">
          <div className="border-b border-neutral-100 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-5 w-24 rounded-full bg-neutral-200" />
              <div className="h-6 w-20 rounded-full bg-neutral-200" />
            </div>
            <div className="mt-2 flex gap-2">
              <div className="h-4 w-28 rounded bg-neutral-100" />
              <div className="h-4 w-16 rounded bg-neutral-100" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex justify-between rounded-2xl bg-neutral-50 p-3">
                <div className="h-4 w-32 rounded bg-neutral-200" />
                <div className="h-4 w-8 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <div className="h-11 w-full rounded-2xl bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const minutes = Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  const isUrgent = minutes >= 15;
  const isWarning = minutes >= 8;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isUrgent ? "bg-red-100 text-red-700" : isWarning ? "bg-orange-100 text-orange-700" : "bg-neutral-100 text-neutral-600"
      }`}
      aria-label={`${minutes} minute${minutes === 1 ? "" : "s"} elapsed${isUrgent ? ", urgent" : isWarning ? ", warning" : ""}`}
    >
      <Clock className="h-3 w-3" aria-hidden="true" />
      {minutes}m
    </span>
  );
}

export function KDSBoard() {
  const queryClient = useQueryClient();
  // Track known order IDs so we only notify on genuinely new tickets
  const knownOrderIds = useRef<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch kitchen orders");
      return res.json();
    },
    // SSE handles instant updates; polling is a safety fallback every 60 s
    refetchInterval: 60_000,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const { status: realtimeStatus } = useRealtime({
    invalidateKeys: [["kitchen-orders"]],
    onOrderCreated: (event) => {
      // Only chime + toast for PAID orders — cash orders land here immediately.
      // PENDING_PAYMENT (card/QRIS) orders are excluded: they aren't kitchen-
      // ready yet and must not trigger a false alert.
      if (event.status === "PAID" && !knownOrderIds.current.has(event.id)) {
        playNewOrderChime();
        toast("🍽️ New order incoming", {
          description: `Order #${event.orderNumber} is ready for the kitchen`,
          duration: 5000,
        });
      }
    },
  });

  const orders = useMemo<Order[]>(() => {
    if (!data?.success) return [];
    const all = data.data as Order[];
    const kitchen = all.filter((o) => KITCHEN_STATUSES.includes(o.status));
    // Sync known IDs with current data
    kitchen.forEach((o) => knownOrderIds.current.add(o.id));
    return kitchen;
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to update order");
      return json;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      const messages: Record<string, string> = {
        PREPARING: "Order is now being prepared",
        READY: "Order is ready for serving",
      };
      toast.success(messages[status] ?? "Order updated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update order");
    },
  });

  if (isLoading) return <KDSSkeleton />;

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">Failed to load kitchen orders</p>
        <p className="mt-1 text-sm text-red-500">Check your connection and try again.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <ConnectionStatusBadge status={realtimeStatus} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-white py-20 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
            <ChefHat className="h-8 w-8 text-neutral-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-neutral-700">Kitchen is all clear</p>
          <p className="mt-1 text-sm text-neutral-400">New orders will appear here automatically.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ConnectionStatusBadge status={realtimeStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => {
            const timezone = order.restaurant?.timezone ?? "Asia/Makassar";
            const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
            const isDineIn = order.type === "DINE_IN";
            const isPending = updateMutation.isPending && updateMutation.variables?.id === order.id;

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`rounded-3xl border bg-white p-4 shadow-sm ${
                  order.status === "PREPARING"
                    ? "border-orange-200 ring-1 ring-orange-100"
                    : "border-neutral-200"
                }`}
              >
                <div className="border-b border-neutral-100 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold">
                      {formatOrderNumber(order.orderNumber, orderPrefix)}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <ElapsedBadge createdAt={order.createdAt} />
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        order.status === "PAID"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {order.status === "PAID" ? "Queued" : "Cooking"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-neutral-500">
                    <span>{formatDateTime(order.createdAt, timezone)}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <UtensilsCrossed className="h-3 w-3" />
                      {isDineIn ? `Table ${order.table?.name ?? "?"}` : "Takeaway"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                      <span className="font-medium text-neutral-800">{item.menuItem.name}</span>
                      <span className="font-bold text-neutral-600">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 border-t border-neutral-100 pt-3">
                  {order.status === "PAID" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => updateMutation.mutate({ id: order.id, status: "PREPARING" })}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span className="sr-only">Starting cooking…</span>
                        </>
                      ) : "Start Cooking"}
                    </button>
                  )}
                  {order.status === "PREPARING" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => updateMutation.mutate({ id: order.id, status: "READY" })}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span className="sr-only">Marking as ready…</span>
                        </>
                      ) : "Mark as Ready"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
