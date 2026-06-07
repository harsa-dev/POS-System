import { useRef, useState } from "react";
import { toast } from "sonner";

import { OrdersWorkspaceBoard } from "@/app/workspace/restaurant/orders/orders-workspace-board";
import {
  type OrdersWorkspaceOrder,
  useOrdersWorkspaceOrders,
} from "@/app/workspace/restaurant/orders/use-orders-workspace-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage, orderApi } from "@/lib/api";

export default function RestaurantOrdersWorkspace() {
  const orders = useOrdersWorkspaceOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const updatingOrderIdRef = useRef<string | null>(null);

  async function handleCompleteOrder(order: OrdersWorkspaceOrder) {
    if (updatingOrderIdRef.current !== null) {
      if (import.meta.env.DEV) {
        console.debug("[orders-v3] duplicate completion blocked", {
          activeOrderId: updatingOrderIdRef.current,
          orderId: order.id,
        });
      }

      return;
    }

    updatingOrderIdRef.current = order.id;
    setUpdatingOrderId(order.id);

    try {
      const result = await orderApi.updateStatusWithResult(order.id, {
        status: "COMPLETED",
      });

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message ||
            `Failed to complete order (${result.status})`,
        );
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
      description="V3 order lifecycle workspace for observing orders and safely completing served orders."
      currentRouteLabel="current Orders route"
      currentRoutePath={ROUTES.ORDERS}
    >
      <OrdersWorkspaceBoard
        errorMessage={orders.errorMessage}
        onCompleteOrder={handleCompleteOrder}
        orders={orders.orders}
        status={orders.status}
        updatingOrderId={updatingOrderId}
      />
    </WorkspaceShell>
  );
}
