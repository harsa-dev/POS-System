import {
  AlertTriangle,
  CheckCheck,
  Clock,
  Loader2,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import type {
  ServingOrder,
  ServingOrderTargetStatus,
} from "./use-serving-orders";
import {
  restaurantOrderStatusTones,
  restaurantServingActionTargets,
} from "@/app/workspace/restaurant/shared/restaurant-workspace-status";
import {
  EmptyState,
  InlineErrorNotice,
  LoadErrorState,
  RefreshingIndicator,
  StatusBadge,
} from "@/app/workspace/restaurant/shared/workspace-feedback";

type ServingOrdersBoardProps = {
  orders: ServingOrder[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  isRefreshing: boolean;
  updatingOrderId: string | null;
  onUpdateStatus: (
    orderId: string,
    status: ServingOrderTargetStatus,
  ) => Promise<void>;
};

function ServingOrdersSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading serving orders"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="min-h-64 animate-pulse rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          key={index}
        >
          <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
            <div>
              <div className="h-4 w-28 rounded bg-neutral-200" />
              <div className="mt-3 h-3 w-36 rounded bg-neutral-100" />
            </div>
            <div className="h-7 w-20 rounded-full bg-neutral-200" />
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((__, itemIndex) => (
              <div
                className="flex justify-between rounded-xl bg-neutral-50 p-3"
                key={itemIndex}
              >
                <div className="h-4 w-32 rounded bg-neutral-200" />
                <div className="h-4 w-8 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-10 rounded-xl bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

function ServingSummary({ orders }: { orders: ServingOrder[] }) {
  const dineInCount = orders.filter(
    (order) => order.orderTypeLabel === "Dine In",
  ).length;
  const takeawayCount = orders.length - dineInCount;
  const itemCount = orders.reduce((total, order) => total + order.itemCount, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Ready Orders
        </p>
        <p className="mt-2 text-2xl font-bold text-green-700">
          {orders.length}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Dine In
        </p>
        <p className="mt-2 text-2xl font-bold text-blue-700">{dineInCount}</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Takeaway
        </p>
        <p className="mt-2 text-2xl font-bold text-orange-700">
          {takeawayCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Total Items
        </p>
        <p className="mt-2 text-2xl font-bold text-neutral-950">{itemCount}</p>
      </div>
    </div>
  );
}

function ServingOrderCard({
  order,
  isUpdating,
  onUpdateStatus,
}: {
  order: ServingOrder;
  isUpdating: boolean;
  onUpdateStatus: (
    orderId: string,
    status: ServingOrderTargetStatus,
  ) => Promise<void>;
}) {
  const targetStatus = restaurantServingActionTargets[order.status];
  const canUpdateStatus = Boolean(targetStatus);

  return (
    <article className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm ring-1 ring-green-50 transition hover:border-green-300">
      <div className="border-b border-neutral-100 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-950">
              {order.orderCode}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {order.createdAtLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
                {order.destination}
              </span>
            </div>
          </div>
          <StatusBadge
            className="px-3"
            tone={restaurantOrderStatusTones[order.status]}
          >
            {order.statusLabel}
          </StatusBadge>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-green-100 bg-green-50 p-3">
        <p className="text-xs font-semibold uppercase text-green-700">
          Deliver To
        </p>
        <p className="mt-1 text-xl font-bold text-neutral-950">
          {order.destination}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
          {order.orderTypeLabel}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {order.items.map((item) => (
          <div
            className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm"
            key={item.id}
          >
            <span className="font-semibold text-neutral-800">{item.name}</span>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-neutral-600">
              x{item.quantity}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <button
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUpdating || !canUpdateStatus}
          onClick={() => {
            if (!targetStatus) return;
            void onUpdateStatus(order.id, targetStatus);
          }}
          type="button"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Marking served...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Mark as Served
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export function ServingOrdersBoard({
  orders,
  status,
  errorMessage,
  isRefreshing,
  updatingOrderId,
  onUpdateStatus,
}: ServingOrdersBoardProps) {
  if (status === "loading") {
    return <ServingOrdersSkeleton />;
  }

  if (status === "error") {
    return (
      <LoadErrorState
        description={errorMessage ?? "Please check the connection and try again."}
        icon={AlertTriangle}
        title="Failed to load serving orders"
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        description="Orders marked ready from Kitchen V3 will appear here."
        icon={CheckCheck}
        title="No ready orders"
      />
    );
  }

  return (
    <div className="space-y-4">
      <ServingSummary orders={orders} />
      <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <PackageCheck className="h-4 w-4 text-neutral-500" aria-hidden="true" />
        <span>Serving actions update order status after backend confirmation.</span>
        {isRefreshing ? <RefreshingIndicator className="ml-auto" /> : null}
      </div>
      {errorMessage ? (
        <InlineErrorNotice>{errorMessage}</InlineErrorNotice>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => (
          <ServingOrderCard
            isUpdating={updatingOrderId === order.id}
            key={order.id}
            onUpdateStatus={onUpdateStatus}
            order={order}
          />
        ))}
      </div>
    </div>
  );
}
