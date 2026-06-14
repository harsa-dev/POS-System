import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { restaurantApi, type RestaurantOrderDto } from "@/lib/api";
import { formatDateTime, formatOrderNumber } from "@/lib/utils/format";
import { servingOrderStatusLabels } from "@/app/workspace/restaurant/shared/restaurant-workspace-status";

export type ServingOrderStatus = "READY";
export type ServingOrderTargetStatus = "SERVED";

export type ServingOrderItem = {
  id: string;
  name: string;
  quantity: number;
};

export type ServingOrder = {
  id: string;
  orderCode: string;
  orderNumber: number;
  status: ServingOrderStatus;
  statusLabel: string;
  destination: string;
  orderTypeLabel: string;
  createdAt: string;
  createdAtLabel: string;
  itemCount: number;
  items: ServingOrderItem[];
};

type ServingOrdersState = "loading" | "ready" | "error";

type ServingOrdersResult = {
  orders: ServingOrder[];
  status: ServingOrdersState;
  errorMessage: string | null;
  isRefreshing: boolean;
  reload: () => Promise<void>;
};

type ServingOrderResponse = RestaurantOrderDto & {
  status: ServingOrderStatus;
};

function isServingStatus(status: string): status is ServingOrderStatus {
  return status === "READY";
}

function isServingOrderResponse(
  order: RestaurantOrderDto,
): order is ServingOrderResponse {
  return isServingStatus(order.status);
}

function mapOrderToServingOrder(order: ServingOrderResponse): ServingOrder {
  const items = order.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
  }));
  const isDineIn = order.type === "DINE_IN";

  return {
    id: order.id,
    orderCode: order.code || formatOrderNumber(order.orderNumber, "ORD"),
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: servingOrderStatusLabels[order.status],
    destination: isDineIn
      ? `Table ${order.table?.name ?? "Unknown"}`
      : "Takeaway counter",
    orderTypeLabel: isDineIn ? "Dine In" : "Takeaway",
    createdAt: order.createdAt,
    createdAtLabel: formatDateTime(order.createdAt, "Asia/Makassar"),
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    items,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Restaurant serving orders are unavailable.";
}

export function useServingOrders(): ServingOrdersResult {
  const [orders, setOrders] = useState<ServingOrder[]>([]);
  const [status, setStatus] = useState<ServingOrdersState>("loading");
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
      const response = await restaurantApi.listServingQueue();

      if (!response.success) {
        throw new Error(response.message ?? "Failed to load serving orders");
      }

      const mappedOrders = (response.data ?? [])
        .filter(isServingOrderResponse)
        .map(mapOrderToServingOrder)
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
