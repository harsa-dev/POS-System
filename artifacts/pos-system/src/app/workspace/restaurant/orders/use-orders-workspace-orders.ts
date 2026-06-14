import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { restaurantClient, type RestaurantOrderDto } from "@/lib/api";
import {
  formatCurrency,
  formatDateTime,
  formatOrderNumber,
} from "@/lib/utils/format";
import {
  isRestaurantOrderStatus,
  restaurantOrderStatusLabels,
  type RestaurantOrderStatus,
} from "@/app/workspace/restaurant/shared/restaurant-workspace-status";

export type OrdersWorkspaceStatus = RestaurantOrderStatus;

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
  isDineIn: boolean;
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
  isRefreshing: boolean;
  reload: () => Promise<void>;
};

type OrdersWorkspaceOrderResponse = RestaurantOrderDto & {
  status: OrdersWorkspaceStatus;
};

function isOrdersWorkspaceOrderResponse(
  order: RestaurantOrderDto,
): order is OrdersWorkspaceOrderResponse {
  return isRestaurantOrderStatus(order.status);
}

function mapOrderToWorkspaceOrder(
  order: OrdersWorkspaceOrderResponse,
): OrdersWorkspaceOrder {
  const isDineIn = order.type === "DINE_IN";
  const items = order.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    priceLabel: formatCurrency(item.price),
    subtotalLabel: formatCurrency(item.subtotal),
  }));

  return {
    id: order.id,
    orderCode: order.code || formatOrderNumber(order.orderNumber, "ORD"),
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: restaurantOrderStatusLabels[order.status],
    paymentStatus: order.payment?.status ?? "-",
    destination: isDineIn
      ? `Table ${order.table?.name ?? "Unknown"}`
      : "Takeaway",
    isDineIn,
    orderTypeLabel: isDineIn ? "Dine In" : "Takeaway",
    createdAt: order.createdAt,
    createdAtLabel: formatDateTime(order.createdAt, "Asia/Makassar"),
    totalLabel: formatCurrency(order.total),
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    items,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Restaurant orders are unavailable.";
}

export function useOrdersWorkspaceOrders(): OrdersWorkspaceResult {
  const [orders, setOrders] = useState<OrdersWorkspaceOrder[]>([]);
  const [status, setStatus] = useState<OrdersWorkspaceState>("loading");
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
      const response = await restaurantClient.listActiveOrders();

      if (!response.success) {
        throw new Error(response.message ?? "Failed to load restaurant orders");
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
