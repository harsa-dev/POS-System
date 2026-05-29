"use client";

import { useEffect, useMemo, useState } from "react";
import { orderApi } from "@/lib/api";
import { Link } from "wouter";
import {
  Clock,
  Eye,
  Filter,
  ReceiptText,
  Search,
  Table2,
  UtensilsCrossed,
} from "lucide-react";

import {
  formatCurrency,
  formatDateTime,
  formatOrderNumber,
} from "@/lib/utils/format";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/features/orders/constans/order-status";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataPagination } from "@/components/shared/data-pagination";

const PAGE_SIZE = 20;

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  menuItem: { name: string };
};

type Order = {
  id: string;
  orderNumber: number;
  total: number;
  status: string;
  createdAt: string;
  type: "DINE_IN" | "TAKEAWAY";
  cancelReason?: string | null;
  cancelledAt?: string | null;
  table?: { id: string; name: string; capacity: number } | null;
  items: OrderItem[];
  restaurant?: { currency?: string; timezone?: string; orderPrefix?: string };
};

const statusOptions = ["ALL", ...Object.keys(ORDER_STATUS_LABELS)];

function getStatusStyle(status: string) {
  return (
    ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] ??
    "bg-neutral-100 text-neutral-700"
  );
}

function OrdersSkeleton() {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 rounded-lg bg-neutral-200 animate-pulse" />
          <div className="h-4 w-64 rounded bg-neutral-100 animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-72 rounded-2xl bg-neutral-100 animate-pulse" />
          <div className="h-11 w-36 rounded-2xl bg-neutral-100 animate-pulse" />
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-5 animate-pulse">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-neutral-100" />
                  <div className="space-y-1.5">
                    <div className="h-5 w-36 rounded bg-neutral-200" />
                    <div className="h-4 w-52 rounded bg-neutral-100" />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 space-y-1.5">
                      <div className="h-4 w-28 rounded bg-neutral-200" />
                      <div className="h-3 w-20 rounded bg-neutral-100" />
                      <div className="h-5 w-16 rounded bg-neutral-200" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="xl:w-56 space-y-3">
                <div className="h-8 w-28 rounded-lg bg-neutral-200" />
                <div className="h-6 w-20 rounded-full bg-neutral-100" />
                <div className="h-11 w-full rounded-2xl bg-neutral-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function fetchOrders() {
    const data = await orderApi.listOrders<Order[]>();
    if (data.success) setOrders(data.data ?? []);
    setIsLoading(false);
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
      const formattedOrder = formatOrderNumber(order.orderNumber, orderPrefix);
      const searchableText = [
        formattedOrder,
        order.status,
        order.type,
        order.table?.name,
        ...order.items.map((item) => item.menuItem.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !search || searchableText.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);

  if (isLoading) return <OrdersSkeleton />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Order List</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Track dine-in, takeaway, payment, and kitchen order status.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 shadow-sm sm:w-72">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                aria-label="Search orders"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order..."
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
              <Filter className="h-4 w-4 shrink-0" aria-hidden="true" />
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All Status" : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {paginatedOrders.map((order) => {
            const currency = order.restaurant?.currency ?? "IDR";
            const timezone = order.restaurant?.timezone ?? "Asia/Makassar";
            const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
            const isDineIn = order.type === "DINE_IN";
            const isCancelled = order.status === "CANCELLED";

            return (
              <div
                key={order.id}
                className={`p-5 transition hover:bg-neutral-50/80 ${isCancelled ? "bg-red-50/30" : "bg-white"}`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                        <ReceiptText className="h-5 w-5 text-neutral-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold tracking-tight">
                          Receipt {formatOrderNumber(order.orderNumber, orderPrefix)}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(order.createdAt, timezone)}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            {isDineIn ? <UtensilsCrossed className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
                            {isDineIn ? "Dine In" : "Takeaway"}
                          </span>
                          {isDineIn && order.table && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 font-medium text-neutral-700">
                                <Table2 className="h-4 w-4" />
                                Table {order.table.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isCancelled && order.cancelReason && (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-red-700">Cancellation Reason</p>
                        <p className="mt-1 text-sm text-red-600">{order.cancelReason}</p>
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                          <p className="truncate text-sm font-semibold">{item.menuItem.name}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {item.quantity} × {formatCurrency(item.price, currency)}
                          </p>
                          <p className="mt-2 text-sm font-bold">{formatCurrency(item.subtotal, currency)}</p>
                        </div>
                      ))}
                    </div>

                    {order.items.length > 3 && (
                      <p className="mt-3 text-xs text-neutral-500">+{order.items.length - 3} more items</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-56 xl:items-end">
                    <p className="text-2xl font-bold">{formatCurrency(order.total, currency)}</p>
                    <StatusBadge className={getStatusStyle(order.status)}>
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
                    </StatusBadge>
                    {isDineIn && order.table && (
                      <div className="w-full rounded-2xl border bg-white p-3 text-sm xl:text-right">
                        <p className="text-xs text-neutral-500">Dining Table</p>
                        <p className="font-bold">Table {order.table.name}</p>
                        <p className="text-xs text-neutral-500">{order.table.capacity} seats</p>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Eye className="h-4 w-4" />
                      View Receipt
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <EmptyState
              icon={ReceiptText}
              title="No orders found"
              description={
                search || statusFilter !== "ALL"
                  ? "Try changing your search or status filter."
                  : "Orders will appear here once customers start placing them."
              }
            />
          )}
        </div>

        {filteredOrders.length > PAGE_SIZE && (
          <DataPagination
            currentPage={page}
            totalPages={totalPages}
            startItem={startIndex + 1}
            endItem={Math.min(startIndex + PAGE_SIZE, filteredOrders.length)}
            totalItems={filteredOrders.length}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </div>
    </div>
  );
}
