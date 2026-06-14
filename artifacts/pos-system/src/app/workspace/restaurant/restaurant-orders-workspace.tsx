import { useRef, useState } from "react";
import { toast } from "sonner";

import { OrdersWorkspaceBoard } from "@/app/workspace/restaurant/orders/orders-workspace-board";
import {
  type OrdersWorkspaceOrder,
  useOrdersWorkspaceOrders,
} from "@/app/workspace/restaurant/orders/use-orders-workspace-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage, restaurantApi } from "@/lib/api";

export default function RestaurantOrdersWorkspace() {
  const orders = useOrdersWorkspaceOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const updatingOrderIdRef = useRef<string | null>(null);

  async function handleCompleteOrder(order: OrdersWorkspaceOrder) {
    if (updatingOrderIdRef.current !== null) {
      if (import.meta.env.DEV) {
        console.debug("[restaurant-orders] duplicate completion blocked", {
          activeOrderId: updatingOrderIdRef.current,
          orderId: order.id,
        });
      }

      return;
    }

    updatingOrderIdRef.current = order.id;
    setUpdatingOrderId(order.id);

    try {
      const response = await restaurantApi.updateOrderStatus(order.id, {
        targetStatus: "COMPLETED",
      });

      if (!response.success) {
        toast.error(response.message || "Failed to complete order");
        return;
      }

      await orders.reload();

      toast.success(
        order.isDineIn
          ? "Order completed. Table moved to cleaning."
          : "Order completed.",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to complete order"));
    } finally {
      updatingOrderIdRef.current = null;
      setUpdatingOrderId(null);
    }
  }

  return (
    <WorkspaceShell
      title="Restaurant Orders Workspace"
      description="Restaurant order lifecycle workspace for observing active orders and safely completing served orders."
      currentRouteLabel="current Orders route"
      currentRoutePath={ROUTES.ORDERS}
    >
      <OrdersWorkspaceBoard
        errorMessage={orders.errorMessage}
        isRefreshing={orders.isRefreshing}
        onCompleteOrder={handleCompleteOrder}
        orders={orders.orders}
        status={orders.status}
        updatingOrderId={updatingOrderId}
      />
    </WorkspaceShell>
  );
}
