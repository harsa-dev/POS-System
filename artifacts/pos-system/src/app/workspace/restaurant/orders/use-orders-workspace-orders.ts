import { useCallback, useEffect, useMemo, useState } from "react";

import { orderApi } from "@/lib/api";
import {
  formatCurrency,
  formatDateTime,
  formatOrderNumber,
} from "@/lib/utils/format";

export type OrdersWorkspaceStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export type OrdersWorkspaceItem = {
  id: string;
  name: string;
  quantity: number;
  priceLabel: string;
  subtotalLabel: string;
};

export type OrdersWorkspaceOrder = {
  id: string;
  orderCode: string;
  orderNumber: number;
  status: OrdersWorkspaceStatus;
  statusLabel: string;
  paymentStatus: string;
  destination: string;
  orderTypeLabel: string;
  createdAt: string;
  createdAtLabel: string;
  totalLabel: string;
  itemCount: number;
  items: OrdersWorkspaceItem[];
};

type OrdersWorkspaceState = "loading" | "ready" | "error";

type OrdersWorkspaceResult = {
  orders: OrdersWorkspaceOrder[];
  status: OrdersWorkspaceState;
  errorMessage: string | null;
  reload: () => Promise<void>;
};

type OrderResponse = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: string;
  type: "DINE_IN" | "TAKEAWAY";
  table?: { name?: string | null } | null;
  payment?: { status?: string | null } | null;
  restaurant?: {
    currency?: string | null;
    timezone?: string | null;
    orderPrefix?: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    menuItem?: { name?: string | null } | null;
  }>;
};

type OrdersWorkspaceOrderResponse = OrderResponse & {
  status: OrdersWorkspaceStatus;
};

const orderStatusLabels: Record<OrdersWorkspaceStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function isOrdersWorkspaceStatus(
  status: string,
): status is OrdersWorkspaceStatus {
  return status in orderStatusLabels;
}

function isOrdersWorkspaceOrderResponse(
  order: OrderResponse,
): order is OrdersWorkspaceOrderResponse {
  return isOrdersWorkspaceStatus(order.status);
}

function mapOrderToWorkspaceOrder(
  order: OrdersWorkspaceOrderResponse,
): OrdersWorkspaceOrder {
  const currency = order.restaurant?.currency ?? "IDR";
  const timezone = order.restaurant?.timezone ?? "Asia/Makassar";
  const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
  const isDineIn = order.type === "DINE_IN";
  const items = order.items.map((item) => ({
    id: item.id,
    name: item.menuItem?.name ?? "Unnamed item",
    quantity: item.quantity,
    priceLabel: formatCurrency(item.price, currency),
    subtotalLabel: formatCurrency(item.subtotal, currency),
  }));

  return {
    id: order.id,
    orderCode: formatOrderNumber(order.orderNumber, orderPrefix),
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: orderStatusLabels[order.status],
    paymentStatus: order.payment?.status ?? "-",
    destination: isDineIn
      ? `Table ${order.table?.name ?? "Unknown"}`
      : "Takeaway",
    orderTypeLabel: isDineIn ? "Dine In" : "Takeaway",
    createdAt: order.createdAt,
    createdAtLabel: formatDateTime(order.createdAt, timezone),
    totalLabel: formatCurrency(order.total, currency),
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    items,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Orders are unavailable.";
}

export function useOrdersWorkspaceOrders(): OrdersWorkspaceResult {
  const [orders, setOrders] = useState<OrdersWorkspaceOrder[]>([]);
  const [status, setStatus] = useState<OrdersWorkspaceState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await orderApi.listOrders<OrderResponse[]>();

      if (!response.success) {
        throw new Error(response.message ?? "Failed to load orders");
      }

      const mappedOrders = (response.data ?? [])
        .filter(isOrdersWorkspaceOrderResponse)
        .map(mapOrderToWorkspaceOrder)
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        );

      setOrders(mappedOrders);
      setStatus("ready");
    } catch (error) {
      setOrders([]);
      setErrorMessage(getErrorMessage(error));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return useMemo(
    () => ({
      orders,
      status,
      errorMessage,
      reload: loadOrders,
    }),
    [errorMessage, loadOrders, orders, status],
  );
}
