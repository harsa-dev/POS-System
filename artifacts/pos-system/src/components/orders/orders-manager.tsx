"use client";

import { useEffect, useMemo, useState } from "react";
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

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  menuItem: {
    name: string;
  };
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
  table?: {
    id: string;
    name: string;
    capacity: number;
  } | null;
  items: OrderItem[];
  restaurant?: {
    currency?: string;
    timezone?: string;
    orderPrefix?: string;
  };
};

const statusOptions = [
  "ALL",
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
];

function getStatusStyle(status: string) {
  if (status === "COMPLETED") return "bg-neutral-100 text-neutral-700";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "PENDING_PAYMENT") return "bg-yellow-100 text-yellow-700";
  if (status === "PAID") return "bg-blue-100 text-blue-700";
  if (status === "PREPARING") return "bg-orange-100 text-orange-700";
  if (status === "READY") return "bg-green-100 text-green-700";
  if (status === "SERVED") return "bg-purple-100 text-purple-700";

  return "bg-neutral-100 text-neutral-700";
}

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function fetchOrders() {
    const res = await fetch("/api/orders");
    const data = await res.json();

    if (data.success) {
      setOrders(data.data);
    }
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

      const matchesSearch = searchableText.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, []);

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
              <Search className="h-4 w-4 shrink-0" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order..."
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
              <Filter className="h-4 w-4 shrink-0" />

              <select
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
          {filteredOrders.map((order) => {
            const currency = order.restaurant?.currency ?? "IDR";
            const timezone = order.restaurant?.timezone ?? "Asia/Makassar";
            const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
            const isDineIn = order.type === "DINE_IN";
            const isCancelled = order.status === "CANCELLED";

            return (
              <div
                key={order.id}
                className={`p-5 transition hover:bg-neutral-50/80 ${
                  isCancelled ? "bg-red-50/30" : "bg-white"
                }`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                        <ReceiptText className="h-5 w-5 text-neutral-700" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold tracking-tight">
                          Receipt{" "}
                          {formatOrderNumber(order.orderNumber, orderPrefix)}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(order.createdAt, timezone)}</span>
                          <span>•</span>

                          <span className="inline-flex items-center gap-1">
                            {isDineIn ? (
                              <UtensilsCrossed className="h-4 w-4" />
                            ) : (
                              <ReceiptText className="h-4 w-4" />
                            )}

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
                        <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                          Cancellation Reason
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                          {order.cancelReason}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
                        >
                          <p className="truncate text-sm font-semibold">
                            {item.menuItem.name}
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {item.quantity} ×{" "}
                            {formatCurrency(item.price, currency)}
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {formatCurrency(item.subtotal, currency)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {order.items.length > 3 && (
                      <p className="mt-3 text-xs text-neutral-500">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-56 xl:items-end">
                    <p className="text-2xl font-bold">
                      {formatCurrency(order.total, currency)}
                    </p>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                        order.status,
                      )}`}
                    >
                      {order.status}
                    </span>

                    {isDineIn && order.table && (
                      <div className="w-full rounded-2xl border bg-white p-3 text-sm xl:text-right">
                        <p className="text-xs text-neutral-500">Dining Table</p>
                        <p className="font-bold">Table {order.table.name}</p>
                        <p className="text-xs text-neutral-500">
                          {order.table.capacity} seats
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
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
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
                <ReceiptText className="h-6 w-6 text-neutral-500" />
              </div>

              <p className="mt-4 font-semibold">No orders found.</p>
              <p className="mt-1 text-sm text-neutral-500">
                Try changing your search or status filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}