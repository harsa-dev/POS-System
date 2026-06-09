import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { orderApi } from "@/lib/api";
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

function isOrdersWorkspaceOrderResponse(
  order: OrderResponse,
): order is OrdersWorkspaceOrderResponse {
  return isRestaurantOrderStatus(order.status);
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
    statusLabel: restaurantOrderStatusLabels[order.status],
    paymentStatus: order.payment?.status ?? "-",
    destination: isDineIn
      ? `Table ${order.table?.name ?? "Unknown"}`
      : "Takeaway",
    isDineIn,
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
