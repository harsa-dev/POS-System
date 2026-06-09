import { Clock3 } from "lucide-react";

import type { PosOpenOrderItem } from "./pos-workspace-types";
import { InlineErrorNotice } from "@/app/workspace/restaurant/shared/workspace-feedback";

type PosOpenOrdersPanelProps = {
  orders: PosOpenOrderItem[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  isUsingFallback: boolean;
  isRefreshing: boolean;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string | null) => void;
};

export function PosOpenOrdersPanel({
  orders,
  status,
  errorMessage,
  isUsingFallback,
  isRefreshing,
  selectedOrderId,
  onSelectOrder,
}: PosOpenOrdersPanelProps) {
  const isLoading = status === "loading";

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Open Orders</h3>
          <p className="mt-1 text-xs text-neutral-500">
            {isRefreshing
              ? "Refreshing active orders..."
              : isUsingFallback
                ? "Static preview orders"
                : "Read-only active orders"}
          </p>
        </div>
        <Clock3 className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>

      {errorMessage ? (
        <InlineErrorNotice className="mt-4 p-3 text-xs leading-5">
          {errorMessage}
        </InlineErrorNotice>
      ) : null}

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-16 animate-pulse rounded-2xl bg-neutral-100"
              key={index}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">
          No active orders are currently open.
        </div>
      ) : null}

      {!isLoading && orders.length > 0 ? (
        <div className="mt-4 space-y-2">
          {orders.map((order) => {
            const isSelected = selectedOrderId === order.id;

            return (
              <button
                aria-pressed={isSelected}
                className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition hover:border-neutral-300 ${
                  isSelected
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700"
                }`}
                key={order.id}
                onClick={() => onSelectOrder(isSelected ? null : order.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {order.code} - {order.table}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isSelected ? "text-white/70" : "text-neutral-500"
                      }`}
                    >
                      {order.status} · {order.createdTime} · {order.itemCount} items
                    </p>
                  </div>
                  <p className="shrink-0 font-bold">{order.total}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
