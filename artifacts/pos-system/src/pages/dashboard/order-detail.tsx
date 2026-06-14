import { useEffect, useState } from "react";
import { orderApi } from "@/lib/api";
import { Link } from "wouter";
import { ROUTES } from "@/constants/routes";
import {
  Banknote,
  CalendarClock,
  CreditCard,
  ReceiptText,
  Table2,
  UtensilsCrossed,
} from "lucide-react";

import { PrintReceiptButton } from "@/features/restaurant/core-system/server/orders/print-receipt-button";
import { CloseOrderButton } from "@/features/restaurant/core-system/server/orders/close-order-button";
import { MoveTableButton } from "@/features/restaurant/core-system/server/orders/move-table-button";
import { CancelOrderButton } from "@/features/restaurant/core-system/server/orders/cancel-order-button";
import { formatCurrency, formatDateTime, formatOrderNumber } from "@/lib/utils/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/features/orders/constants/order-status";

type OrderDetailPageProps = {
  id: string;
};

function getStatusStyle(status: string) {
  return (
    ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] ??
    "bg-neutral-100 text-neutral-700"
  );
}

export default function OrderDetailPage({ id }: OrderDetailPageProps) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchOrder() {
    try {
      setIsLoading(true);
      const res = await orderApi.getOrderResponse(id);
      if (!res.ok) {
        setError("Order not found");
        return;
      }
      const data = await res.json();
      setOrder(data.data);
    } catch {
      setError("Failed to load order");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchOrder(); }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-neutral-500">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-800">Order Not Found</h2>
          <p className="mt-2 text-sm text-neutral-500">{error}</p>
          <Link href={ROUTES.ORDERS} className="mt-4 inline-block text-sm font-medium underline">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currency = order.restaurant?.currency ?? "IDR";
  const timezone = order.restaurant?.timezone ?? "Asia/Makassar";
  const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
  const receiptFooter = order.restaurant?.receiptFooter ?? "Thank you for your order.";
  const isDineIn = order.type === "DINE_IN";
  const canMoveTable = isDineIn && order.status !== "COMPLETED" && order.status !== "CANCELLED";
  const canCancel = order.status !== "COMPLETED" && order.status !== "CANCELLED";
  const canClose = order.status === "SERVED";

  return (
    <section className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Detail</h1>
        <p className="mt-2 text-neutral-500">Review receipt, payment, table, and order status.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
                <ReceiptText className="h-6 w-6 text-neutral-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Receipt {formatOrderNumber(order.orderNumber, orderPrefix)}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{order.restaurant?.name}</p>
              </div>
            </div>
            <StatusBadge className={getStatusStyle(order.status)}>
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
            </StatusBadge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <CalendarClock className="h-4 w-4" /> Date
              </div>
              <p className="mt-2 font-semibold">{formatDateTime(order.createdAt, timezone)}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <UtensilsCrossed className="h-4 w-4" /> Order Type
              </div>
              <p className="mt-2 font-semibold">{isDineIn ? "Dine In" : "Takeaway"}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <CreditCard className="h-4 w-4" /> Payment
              </div>
              <p className="mt-2 font-semibold">{order.paymentMethod}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Banknote className="h-4 w-4" /> Total
              </div>
              <p className="mt-2 text-lg font-bold">{formatCurrency(order.total, currency)}</p>
            </div>
          </div>

          {isDineIn && order.table && (
            <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                  <Table2 className="h-5 w-5 text-neutral-700" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Dining Table</p>
                  <p className="text-lg font-bold">Table {order.table.name}</p>
                </div>
                <span className="ml-auto rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {order.table.capacity} seats
                </span>
              </div>
            </div>
          )}

          {order.status === "CANCELLED" && order.cancelReason && (
            <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-red-700">Cancellation Reason</p>
              <p className="mt-2 text-sm text-red-600">{order.cancelReason}</p>
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-200">
            <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-4">
              <h3 className="font-bold">Order Items</h3>
            </div>
            <div className="divide-y divide-neutral-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.menuItem?.name ?? item.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.quantity} × {formatCurrency(item.price, currency)}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold">{formatCurrency(item.subtotal, currency)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="print-area rounded-3xl border border-neutral-200 bg-white p-6 text-sm shadow-sm">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-[0.2em] text-neutral-800">RECEIPT</h2>
              <p className="mt-3 font-semibold">{order.restaurant?.name}</p>
              {order.restaurant?.address && <p className="text-neutral-500">{order.restaurant.address}</p>}
              {order.restaurant?.phone && <p className="text-neutral-500">Tel: {order.restaurant.phone}</p>}
            </div>
            <div className="mt-5 space-y-1 border-t border-dashed pt-3">
              <div className="flex justify-between gap-4">
                <span>Receipt No</span>
                <span>{formatOrderNumber(order.orderNumber, orderPrefix)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Status</span>
                <span>{order.status}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Date</span>
                <span className="text-right">{formatDateTime(order.createdAt, timezone)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Order Type</span>
                <span>{isDineIn ? "Dine In" : "Takeaway"}</span>
              </div>
              {isDineIn && order.table && (
                <div className="flex justify-between gap-4">
                  <span>Table</span>
                  <span>Table {order.table.name}</span>
                </div>
              )}
            </div>
            <div className="mt-4 border-t border-dashed pt-3">
              <div className="space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id}>
                    <div className="flex justify-between gap-4">
                      <span>{item.menuItem?.name ?? item.name}</span>
                      <span>{formatCurrency(item.subtotal, currency)}</span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {item.quantity} × {formatCurrency(item.price, currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-1 border-t border-dashed pt-3">
              <div className="flex justify-between"><span>Payment</span><span>{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span>Payment Status</span><span>{order.payment?.status ?? "-"}</span></div>
              <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(order.amountPaid ?? 0, currency)}</span></div>
              <div className="flex justify-between"><span>Change</span><span>{formatCurrency(order.changeAmount ?? 0, currency)}</span></div>
            </div>
            <div className="mt-4 space-y-1 border-t border-dashed pt-3">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal ?? 0, currency)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.taxAmount ?? 0, currency)}</span></div>
              <div className="flex justify-between"><span>Service</span><span>{formatCurrency(order.serviceAmount ?? 0, currency)}</span></div>
              <div className="mt-2 flex justify-between border-t border-dashed pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total, currency)}</span>
              </div>
            </div>
            <div className="mt-6 text-center text-sm tracking-wide text-neutral-600">{receiptFooter}</div>
          </div>

          <div className="space-y-3 print:hidden">
            {canMoveTable && <MoveTableButton orderId={order.id} />}
            {canClose && <CloseOrderButton orderId={order.id} />}
            {canCancel && <CancelOrderButton orderId={order.id} />}
            <PrintReceiptButton />
            <Link
              href={ROUTES.ORDERS}
              className="flex h-11 w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm font-semibold transition hover:bg-neutral-50"
            >
              Back to Orders
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
