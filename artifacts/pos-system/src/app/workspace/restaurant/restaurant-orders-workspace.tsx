import { useRef, useState } from "react";
import { toast } from "sonner";

import { OrdersWorkspaceBoard } from "@/app/workspace/restaurant/orders/orders-workspace-board";
import {
  type OrdersWorkspaceOrder,
  useOrdersWorkspaceOrders,
} from "@/app/workspace/restaurant/orders/use-orders-workspace-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage, restaurantClient } from "@/lib/api";

export default function RestaurantOrdersWorkspace() {
  const orders = useOrdersWorkspaceOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const updatingOrderIdRef = useRef<string | null>(null);

  function lockUpdate(orderId: string): boolean {
    if (updatingOrderIdRef.current !== null) return false;
    updatingOrderIdRef.current = orderId;
    setUpdatingOrderId(orderId);
    return true;
  }

  function unlockUpdate() {
    updatingOrderIdRef.current = null;
    setUpdatingOrderId(null);
  }

  async function handleCompleteOrder(order: OrdersWorkspaceOrder) {
    if (!lockUpdate(order.id)) return;

    try {
      const response = await restaurantClient.updateOrderStatus(order.id, {
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
      unlockUpdate();
    }
  }

  async function handleCancelOrder(order: OrdersWorkspaceOrder, reason: string) {
    if (!lockUpdate(order.id)) return;

    try {
      const response = await restaurantClient.cancelOrder(order.id, { reason });

      if (!response.success) {
        toast.error(response.message || "Failed to cancel order");
        return;
      }

      await orders.reload();
      toast.success("Order cancelled.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to cancel order"));
    } finally {
      unlockUpdate();
    }
  }

  async function handleReversePayment(order: OrdersWorkspaceOrder) {
    if (!lockUpdate(order.id)) return;

    try {
      const response = await restaurantClient.reversePayment(order.id, {
        reason: "Payment voided from Orders Workspace",
      });

      if (!response.success) {
        toast.error(response.message || "Failed to void payment");
        return;
      }

      await orders.reload();
      toast.success("Payment voided. Order returned to pending payment.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to void payment"));
    } finally {
      unlockUpdate();
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
        onCancelOrder={handleCancelOrder}
        onCompleteOrder={handleCompleteOrder}
        onReversePayment={handleReversePayment}
        orders={orders.orders}
        status={orders.status}
        updatingOrderId={updatingOrderId}
      />
    </WorkspaceShell>
  );
}
