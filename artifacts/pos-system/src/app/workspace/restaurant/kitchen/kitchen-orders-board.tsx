import {
  AlertTriangle,
  ChefHat,
  Clock,
  Hourglass,
  Loader2,
  PackageCheck,
  UtensilsCrossed,
} from "lucide-react";

import type {
  KitchenOrder,
  KitchenOrderTargetStatus,
} from "./use-kitchen-orders";
import {
  restaurantKitchenActionTargets,
  restaurantOrderStatusTones,
} from "@/app/workspace/restaurant/shared/restaurant-workspace-status";
import {
  EmptyState,
  InlineErrorNotice,
  LoadErrorState,
  RefreshingIndicator,
  StatusBadge,
} from "@/app/workspace/restaurant/shared/workspace-feedback";

type KitchenOrdersBoardProps = {
  orders: KitchenOrder[];
  pendingPaymentCount: number;
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  isRefreshing: boolean;
  updatingOrderId: string | null;
  onUpdateStatus: (
    orderId: string,
    status: KitchenOrderTargetStatus,
  ) => Promise<void>;
};

function KitchenOrdersSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading kitchen orders"
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

function KitchenSummary({
  orders,
  pendingPaymentCount,
}: {
  orders: KitchenOrder[];
  pendingPaymentCount: number;
}) {
  const queuedCount = orders.filter((order) => order.status === "PAID").length;
  const cookingCount = orders.filter(
    (order) => order.status === "PREPARING",
  ).length;
  const itemCount = orders.reduce((total, order) => total + order.itemCount, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {pendingPaymentCount > 0 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-yellow-700">
            Awaiting Payment
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-800">
            {pendingPaymentCount}
          </p>
        </div>
      )}
      <div className={`rounded-2xl border bg-white p-4 shadow-sm ${pendingPaymentCount > 0 ? "" : "sm:col-span-1"}`}>
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Queued
        </p>
        <p className="mt-2 text-2xl font-bold text-blue-700">{queuedCount}</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Cooking
        </p>
        <p className="mt-2 text-2xl font-bold text-orange-700">
          {cookingCount}
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

function KitchenOrderCard({
  order,
  isUpdating,
  onUpdateStatus,
}: {
  order: KitchenOrder;
  isUpdating: boolean;
  onUpdateStatus: (
    orderId: string,
    status: KitchenOrderTargetStatus,
  ) => Promise<void>;
}) {
  const targetStatus = restaurantKitchenActionTargets[order.status];
  const isCooking = targetStatus === "READY";
  const buttonLabel = isCooking ? "Mark Ready" : "Start Cooking";
  const loadingLabel = isCooking ? "Marking ready..." : "Starting cooking...";
  const canUpdateStatus = Boolean(targetStatus);

  return (
    <article
      className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 ${
        isCooking ? "border-orange-200 ring-1 ring-orange-100" : ""
      }`}
    >
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
          className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            isCooking
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-neutral-950 text-white hover:bg-neutral-800"
          }`}
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
              {loadingLabel}
            </>
          ) : (
            buttonLabel
          )}
        </button>
      </div>
    </article>
  );
}

export function KitchenOrdersBoard({
  orders,
  pendingPaymentCount,
  status,
  errorMessage,
  isRefreshing,
  updatingOrderId,
  onUpdateStatus,
}: KitchenOrdersBoardProps) {
  if (status === "loading") {
    return <KitchenOrdersSkeleton />;
  }

  if (status === "error") {
    return (
      <LoadErrorState
        description={errorMessage ?? "Please check the connection and try again."}
        icon={AlertTriangle}
        title="Failed to load kitchen orders"
      />
    );
  }

  if (orders.length === 0 && pendingPaymentCount === 0) {
    return (
      <EmptyState
        description="Paid and preparing orders will appear here."
        icon={ChefHat}
        title="Kitchen is all clear"
      />
    );
  }

  return (
    <div className="space-y-4">
      <KitchenSummary orders={orders} pendingPaymentCount={pendingPaymentCount} />

      {pendingPaymentCount > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 shadow-sm">
          <Hourglass className="h-4 w-4 shrink-0 text-yellow-600" aria-hidden="true" />
          <span>
            <strong>{pendingPaymentCount}</strong>{" "}
            {pendingPaymentCount === 1 ? "order is" : "orders are"} awaiting
            payment confirmation and will enter the kitchen queue once paid.
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <PackageCheck className="h-4 w-4 text-neutral-500" aria-hidden="true" />
        <span>Kitchen actions update order status after backend confirmation.</span>
        {isRefreshing ? (
          <RefreshingIndicator className="ml-auto" />
        ) : null}
      </div>
      {errorMessage ? (
        <InlineErrorNotice>{errorMessage}</InlineErrorNotice>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState
          description="Orders will appear here once payment is confirmed."
          icon={ChefHat}
          title="No active kitchen orders"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <KitchenOrderCard
              isUpdating={updatingOrderId === order.id}
              key={order.id}
              onUpdateStatus={onUpdateStatus}
              order={order}
            />
          ))}
        </div>
      )}
    </div>
  );
}
