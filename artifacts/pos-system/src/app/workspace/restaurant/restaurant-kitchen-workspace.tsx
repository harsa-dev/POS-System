import { useRef, useState } from "react";
import { toast } from "sonner";

import { KitchenOrdersBoard } from "@/app/workspace/restaurant/kitchen/kitchen-orders-board";
import {
  type KitchenOrderTargetStatus,
  useKitchenOrders,
} from "@/app/workspace/restaurant/kitchen/use-kitchen-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage, restaurantClient } from "@/lib/api";

export default function RestaurantKitchenWorkspace() {
  const kitchenOrders = useKitchenOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const updatingOrderIdRef = useRef<string | null>(null);

  async function handleUpdateStatus(
    orderId: string,
    status: KitchenOrderTargetStatus,
  ) {
    if (updatingOrderIdRef.current !== null) {
      if (import.meta.env.DEV) {
        console.debug("[restaurant-kitchen] duplicate status update blocked", {
          activeOrderId: updatingOrderIdRef.current,
          orderId,
          status,
        });
      }

      return;
    }

    updatingOrderIdRef.current = orderId;
    setUpdatingOrderId(orderId);

    try {
      const response = await restaurantClient.updateOrderStatus(orderId, {
        targetStatus: status,
      });

      if (!response.success) {
        toast.error(response.message || "Failed to update kitchen order status");
        return;
      }

      await kitchenOrders.reload();

      toast.success(
        status === "PREPARING"
          ? "Order moved to cooking"
          : "Order marked ready",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update kitchen order status"));
    } finally {
      updatingOrderIdRef.current = null;
      setUpdatingOrderId(null);
    }
  }

  return (
    <WorkspaceShell
      title="Restaurant Kitchen Workspace"
      description="Restaurant kitchen queue for moving paid orders into cooking and marking prepared orders as ready."
      currentRouteLabel="current Kitchen route"
      currentRoutePath={ROUTES.KDS}
    >
      <KitchenOrdersBoard
        errorMessage={kitchenOrders.errorMessage}
        isRefreshing={kitchenOrders.isRefreshing}
        onUpdateStatus={handleUpdateStatus}
        orders={kitchenOrders.orders}
        status={kitchenOrders.status}
        updatingOrderId={updatingOrderId}
      />
    </WorkspaceShell>
  );
}
