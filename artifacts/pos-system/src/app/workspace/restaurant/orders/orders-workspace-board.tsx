import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  Clock,
  Loader2,
  PackageCheck,
  ReceiptText,
  Search,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import type {
  OrdersWorkspaceOrder,
} from "./use-orders-workspace-orders";
import {
  canCompleteRestaurantOrder,
  restaurantOrderStatusTones,
} from "@/app/workspace/restaurant/shared/restaurant-workspace-status";
import {
  EmptyState,
  InlineErrorNotice,
  LoadErrorState,
  RefreshingIndicator,
  StatusBadge,
} from "@/app/workspace/restaurant/shared/workspace-feedback";

type OrdersWorkspaceFilter =
  | "all"
  | "active"
  | "kitchen"
  | "ready"
  | "served"
  | "closed";

type OrdersWorkspaceBoardProps = {
  orders: OrdersWorkspaceOrder[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  isRefreshing: boolean;
  updatingOrderId: string | null;
  onCompleteOrder: (order: OrdersWorkspaceOrder) => Promise<void>;
  onCancelOrder: (order: OrdersWorkspaceOrder, reason: string) => Promise<void>;
  onReversePayment: (order: OrdersWorkspaceOrder) => Promise<void>;
};

const filters: Array<{ id: OrdersWorkspaceFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "kitchen", label: "Kitchen" },
  { id: "ready", label: "Ready" },
  { id: "served", label: "Served" },
  { id: "closed", label: "Completed / Cancelled" },
];

function matchesFilter(
  order: OrdersWorkspaceOrder,
  filter: OrdersWorkspaceFilter,
) {
  if (filter === "all") return true;
  if (filter === "active") {
    return [
      "PENDING_PAYMENT",
      "PAID",
      "PREPARING",
      "READY",
      "SERVED",
    ].includes(order.status);
  }
  if (filter === "kitchen") return ["PAID", "PREPARING"].includes(order.status);
  if (filter === "ready") return order.status === "READY";
  if (filter === "served") return order.status === "SERVED";
  return ["COMPLETED", "CANCELLED"].includes(order.status);
}

const CANCELLABLE_STATUSES = new Set([
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
]);

const PAYMENT_REVERSIBLE_STATUSES = new Set([
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
]);

function OrdersWorkspaceSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading orders" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-24 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-3 w-24 rounded bg-neutral-100" />
            <div className="mt-3 h-8 w-12 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="border-b border-neutral-100 py-4 last:border-b-0"
            key={index}
          >
            <div className="h-5 w-40 rounded bg-neutral-200" />
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="h-16 rounded-xl bg-neutral-50" />
              <div className="h-16 rounded-xl bg-neutral-50" />
              <div className="h-16 rounded-xl bg-neutral-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersSummary({ orders }: { orders: OrdersWorkspaceOrder[] }) {
  const activeCount = orders.filter((order) => matchesFilter(order, "active"))
    .length;
  const kitchenCount = orders.filter((order) => matchesFilter(order, "kitchen"))
    .length;
  const servedCount = orders.filter((order) => order.status === "SERVED").length;

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Total Orders
        </p>
        <p className="mt-2 text-2xl font-bold text-neutral-950">
          {orders.length}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Active
        </p>
        <p className="mt-2 text-2xl font-bold text-blue-700">{activeCount}</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Kitchen
        </p>
        <p className="mt-2 text-2xl font-bold text-orange-700">
          {kitchenCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Served
        </p>
        <p className="mt-2 text-2xl font-bold text-purple-700">
          {servedCount}
        </p>
      </div>
    </div>
  );
}

function CancelDialog({
  orderCode,
  onConfirm,
  onClose,
  isLoading,
}: {
  orderCode: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-neutral-950">Cancel Order</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {orderCode} — provide a reason for cancellation. Stock and cashflow
          will be automatically reversed.
        </p>
        <textarea
          autoFocus
          className="mt-4 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200"
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter cancellation reason..."
          rows={3}
          value={reason}
        />
        <div className="mt-4 flex gap-3">
          <button
            className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition hover:bg-neutral-50"
            disabled={isLoading}
            onClick={onClose}
            type="button"
          >
            Keep Order
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            disabled={isLoading || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            type="button"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Confirm Cancel"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReversePaymentDialog({
  orderCode,
  onConfirm,
  onClose,
  isLoading,
}: {
  orderCode: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-neutral-950">Void Payment</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {orderCode} — this will void the payment and return the order to
          Pending Payment status. The order itself will remain active.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition hover:bg-neutral-50"
            disabled={isLoading}
            onClick={onClose}
            type="button"
          >
            Keep Payment
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              "Void Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersWorkspaceCard({
  order,
  isUpdating,
  onCompleteOrder,
  onCancelOrder,
  onReversePayment,
}: {
  order: OrdersWorkspaceOrder;
  isUpdating: boolean;
  onCompleteOrder: (order: OrdersWorkspaceOrder) => Promise<void>;
  onCancelOrder: (order: OrdersWorkspaceOrder, reason: string) => Promise<void>;
  onReversePayment: (order: OrdersWorkspaceOrder) => Promise<void>;
}) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReverseDialog, setShowReverseDialog] = useState(false);

  const visibleItems = order.items.slice(0, 3);
  const hiddenItemCount = Math.max(0, order.items.length - visibleItems.length);
  const canComplete = canCompleteRestaurantOrder(order.status);
  const canCancel = CANCELLABLE_STATUSES.has(order.status);
  const canReversePayment = PAYMENT_REVERSIBLE_STATUSES.has(order.status);

  return (
    <>
      <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-neutral-950">
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
                  <span className="inline-flex items-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                    {order.orderTypeLabel}
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

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {visibleItems.map((item) => (
                <div className="rounded-xl bg-neutral-50 p-3" key={item.id}>
                  <p className="truncate text-sm font-semibold text-neutral-800">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {item.quantity} x {item.priceLabel}
                  </p>
                  <p className="mt-2 text-sm font-bold text-neutral-950">
                    {item.subtotalLabel}
                  </p>
                </div>
              ))}
            </div>

            {hiddenItemCount > 0 ? (
              <p className="mt-3 text-xs text-neutral-500">
                +{hiddenItemCount} more item{hiddenItemCount > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>

          <aside className="grid gap-2 text-sm lg:w-56">
            <div className="rounded-xl border bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Total
              </p>
              <p className="mt-1 text-xl font-bold text-neutral-950">
                {order.totalLabel}
              </p>
            </div>
            <div className="rounded-xl border bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Payment
              </p>
              <p className="mt-1 font-bold text-neutral-800">
                {order.paymentStatus}
              </p>
            </div>
            <div className="rounded-xl border bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Items
              </p>
              <p className="mt-1 font-bold text-neutral-800">
                {order.itemCount}
              </p>
            </div>

            {canComplete ? (
              <button
                className="mt-1 flex h-10 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUpdating}
                onClick={() => void onCompleteOrder(order)}
                type="button"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Completing...
                  </>
                ) : (
                  "Complete Order"
                )}
              </button>
            ) : null}

            {canCancel ? (
              <button
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUpdating}
                onClick={() => setShowCancelDialog(true)}
                type="button"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Cancel Order"
                )}
              </button>
            ) : null}

            {canReversePayment ? (
              <button
                className="flex h-9 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUpdating}
                onClick={() => setShowReverseDialog(true)}
                type="button"
              >
                Void Payment
              </button>
            ) : null}
          </aside>
        </div>
      </article>

      {showCancelDialog ? (
        <CancelDialog
          isLoading={isUpdating}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={(reason) => {
            setShowCancelDialog(false);
            void onCancelOrder(order, reason);
          }}
          orderCode={order.orderCode}
        />
      ) : null}

      {showReverseDialog ? (
        <ReversePaymentDialog
          isLoading={isUpdating}
          onClose={() => setShowReverseDialog(false)}
          onConfirm={() => {
            setShowReverseDialog(false);
            void onReversePayment(order);
          }}
          orderCode={order.orderCode}
        />
      ) : null}
    </>
  );
}

export function OrdersWorkspaceBoard({
  orders,
  status,
  errorMessage,
  isRefreshing,
  updatingOrderId,
  onCompleteOrder,
  onCancelOrder,
  onReversePayment,
}: OrdersWorkspaceBoardProps) {
  const [activeFilter, setActiveFilter] =
    useState<OrdersWorkspaceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesLifecycleFilter = matchesFilter(order, activeFilter);
      const searchableText = [
        order.orderCode,
        order.statusLabel,
        order.paymentStatus,
        order.destination,
        order.orderTypeLabel,
        ...order.items.map((item) => item.name),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesLifecycleFilter && matchesSearch;
    });
  }, [activeFilter, orders, searchQuery]);

  if (status === "loading") {
    return <OrdersWorkspaceSkeleton />;
  }

  if (status === "error") {
    return (
      <LoadErrorState
        description={errorMessage ?? "Please check the connection and try again."}
        icon={AlertTriangle}
        title="Failed to load orders"
      />
    );
  }

  return (
    <div className="space-y-4">
      <OrdersSummary orders={orders} />

      {errorMessage ? (
        <InlineErrorNotice>{errorMessage}</InlineErrorNotice>
      ) : null}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-950">
              Order Lifecycle
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span>
                Full lifecycle management — complete served orders, cancel active
                orders, or void payments.
              </span>
              {isRefreshing ? (
                <RefreshingIndicator />
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500 lg:w-72">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              aria-label="Search orders"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search orders..."
              value={searchQuery}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                activeFilter === filter.id
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <PackageCheck className="h-4 w-4 text-neutral-500" aria-hidden="true" />
        Complete is for served orders. Cancel reverses stock and cashflow
        automatically. Void Payment resets payment without cancelling.
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          description={
            orders.length === 0
              ? "Orders created from POS will appear here."
              : "Try changing the lifecycle filter or search term."
          }
          icon={orders.length === 0 ? ReceiptText : CheckCheck}
          title={orders.length === 0 ? "No orders yet" : "No matching orders"}
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrdersWorkspaceCard
              isUpdating={updatingOrderId === order.id}
              key={order.id}
              onCancelOrder={onCancelOrder}
              onCompleteOrder={onCompleteOrder}
              onReversePayment={onReversePayment}
              order={order}
            />
          ))}
        </div>
      )}
    </div>
  );
}
