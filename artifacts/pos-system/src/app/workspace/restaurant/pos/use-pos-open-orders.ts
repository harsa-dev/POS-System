import { useEffect, useMemo, useState } from "react";

import { v3PosOpenOrders } from "@/app/workspace/restaurant/pos-placeholder-data";
import type { PosOpenOrderItem } from "@/app/workspace/restaurant/pos/pos-workspace-types";
import { orderApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils/format";

type PosOpenOrdersStatus = "loading" | "ready" | "error";

type PosOpenOrdersState = {
  orders: PosOpenOrderItem[];
  status: PosOpenOrdersStatus;
  errorMessage: string | null;
  isUsingFallback: boolean;
};

type OrderItemResponse = {
  quantity?: number | null;
};

type OrderResponse = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: string;
  type?: string | null;
  table?: {
    name?: string | null;
  } | null;
  items?: OrderItemResponse[] | null;
};

const activeOrderStatuses = new Set([
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
]);

const fallbackOrders: PosOpenOrderItem[] = v3PosOpenOrders.map((order) => ({
  id: order.id,
  code: order.code,
  table: order.table,
  status: order.status,
  total: order.total,
  createdTime: order.createdTime,
  itemCount: order.itemCount,
}));

function formatOrderCode(orderNumber: number) {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

function formatOrderTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOrderStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getOrderTableLabel(order: OrderResponse) {
  if (order.table?.name) return order.table.name;
  return order.type === "DINE_IN" ? "Dine in" : "Takeaway";
}

function getOrderItemCount(order: OrderResponse) {
  return (order.items ?? []).reduce(
    (total, item) => total + (item.quantity ?? 0),
    0,
  );
}

function mapOrderToOpenOrder(order: OrderResponse): PosOpenOrderItem {
  return {
    id: order.id,
    code: formatOrderCode(order.orderNumber),
    table: getOrderTableLabel(order),
    status: formatOrderStatus(order.status),
    total: formatCurrency(order.total),
    createdTime: formatOrderTime(order.createdAt),
    itemCount: getOrderItemCount(order),
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Open orders are unavailable. Showing static preview data.";
}

export function usePosOpenOrders(): PosOpenOrdersState {
  const [orders, setOrders] = useState<PosOpenOrderItem[]>([]);
  const [status, setStatus] = useState<PosOpenOrdersStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOpenOrders() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await orderApi.listOrders<OrderResponse[]>();
        if (!isMounted) return;

        const activeOrders = (response.data ?? [])
          .filter((order) => activeOrderStatuses.has(order.status))
          .map(mapOrderToOpenOrder);

        setOrders(activeOrders);
        setIsUsingFallback(false);
        setStatus("ready");
      } catch (error) {
        if (!isMounted) return;

        setOrders(fallbackOrders);
        setErrorMessage(getErrorMessage(error));
        setIsUsingFallback(true);
        setStatus("error");
      }
    }

    void loadOpenOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(
    () => ({
      orders,
      status,
      errorMessage,
      isUsingFallback,
    }),
    [errorMessage, isUsingFallback, orders, status],
  );
}
