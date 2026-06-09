import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  isRefreshing: boolean;
  reload: () => void;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const hasLoadedOnceRef = useRef(false);

  const reload = useCallback(() => {
    setReloadVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadOpenOrders() {
      const isBackgroundRefresh = hasLoadedOnceRef.current;
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setStatus("loading");
      }
      setErrorMessage(null);

      try {
        const response = await orderApi.listOrders<OrderResponse[]>();
        if (!isMounted) return;

        const activeOrders = (response.data ?? [])
          .filter((order) => activeOrderStatuses.has(order.status))
          .map(mapOrderToOpenOrder);

        setOrders(activeOrders);
        setIsUsingFallback(false);
        hasLoadedOnceRef.current = true;
        setStatus("ready");
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(getErrorMessage(error));
        if (hasLoadedOnceRef.current) {
          setStatus("ready");
        } else {
          setOrders(fallbackOrders);
          setIsUsingFallback(true);
          setStatus("error");
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    }

    void loadOpenOrders();

    return () => {
      isMounted = false;
    };
  }, [reloadVersion]);

  return useMemo(
    () => ({
      orders,
      status,
      errorMessage,
      isUsingFallback,
      isRefreshing,
      reload,
    }),
    [errorMessage, isRefreshing, isUsingFallback, orders, reload, status],
  );
}
