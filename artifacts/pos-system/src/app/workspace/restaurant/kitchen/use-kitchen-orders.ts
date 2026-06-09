import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { orderApi } from "@/lib/api";
import { formatDateTime, formatOrderNumber } from "@/lib/utils/format";
import { kitchenOrderStatusLabels } from "@/app/workspace/restaurant/shared/restaurant-workspace-status";

export type KitchenOrderStatus = "PAID" | "PREPARING";
export type KitchenOrderTargetStatus = "PREPARING" | "READY";

export type KitchenOrderItem = {
  id: string;
  name: string;
  quantity: number;
};

export type KitchenOrder = {
  id: string;
  orderCode: string;
  orderNumber: number;
  status: KitchenOrderStatus;
  statusLabel: string;
  destination: string;
  createdAt: string;
  createdAtLabel: string;
  itemCount: number;
  items: KitchenOrderItem[];
};

type KitchenOrdersState = "loading" | "ready" | "error";

type KitchenOrdersResult = {
  orders: KitchenOrder[];
  status: KitchenOrdersState;
  errorMessage: string | null;
  isRefreshing: boolean;
  reload: () => Promise<void>;
};

type OrderResponse = {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: string;
  type: "DINE_IN" | "TAKEAWAY";
  table?: { name?: string | null } | null;
  restaurant?: { timezone?: string | null; orderPrefix?: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    menuItem?: { name?: string | null } | null;
  }>;
};

type KitchenOrderResponse = OrderResponse & {
  status: KitchenOrderStatus;
};

function isKitchenStatus(status: string): status is KitchenOrderStatus {
  return status === "PAID" || status === "PREPARING";
}

function isKitchenOrderResponse(
  order: OrderResponse,
): order is KitchenOrderResponse {
  return isKitchenStatus(order.status);
}

function mapOrderToKitchenOrder(order: KitchenOrderResponse): KitchenOrder {
  const timezone = order.restaurant?.timezone ?? "Asia/Makassar";
  const orderPrefix = order.restaurant?.orderPrefix ?? "ORD";
  const items = order.items.map((item) => ({
    id: item.id,
    name: item.menuItem?.name ?? "Unnamed item",
    quantity: item.quantity,
  }));

  return {
    id: order.id,
    orderCode: formatOrderNumber(order.orderNumber, orderPrefix),
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: kitchenOrderStatusLabels[order.status],
    destination:
      order.type === "DINE_IN"
        ? `Table ${order.table?.name ?? "Unknown"}`
        : "Takeaway",
    createdAt: order.createdAt,
    createdAtLabel: formatDateTime(order.createdAt, timezone),
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    items,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Kitchen orders are unavailable.";
}

export function useKitchenOrders(): KitchenOrdersResult {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [status, setStatus] = useState<KitchenOrdersState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const loadOrders = useCallback(async () => {
    const isBackgroundRefresh = hasLoadedOnceRef.current;
    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
    }
    setErrorMessage(null);

    try {
      const response = await orderApi.listOrders<OrderResponse[]>();

      if (!response.success) {
        throw new Error(response.message ?? "Failed to load kitchen orders");
      }

      const mappedOrders = (response.data ?? [])
        .filter(isKitchenOrderResponse)
        .map(mapOrderToKitchenOrder)
        .sort(
          (left, right) =>
            new Date(left.createdAt).getTime() -
            new Date(right.createdAt).getTime(),
        );

      setOrders(mappedOrders);
      hasLoadedOnceRef.current = true;
      setStatus("ready");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      if (hasLoadedOnceRef.current) {
        setStatus("ready");
      } else {
        setOrders([]);
        setStatus("error");
      }
    } finally {
      setIsRefreshing(false);
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
      isRefreshing,
      reload: loadOrders,
    }),
    [errorMessage, isRefreshing, loadOrders, orders, status],
  );
}
