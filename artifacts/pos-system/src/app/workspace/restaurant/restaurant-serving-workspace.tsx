import { useRef, useState } from "react";
import { toast } from "sonner";

import { ServingOrdersBoard } from "@/app/workspace/restaurant/serving/serving-orders-board";
import {
  type ServingOrderTargetStatus,
  useServingOrders,
} from "@/app/workspace/restaurant/serving/use-serving-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage, restaurantClient } from "@/lib/api";

export default function RestaurantServingWorkspace() {
  const servingOrders = useServingOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const updatingOrderIdRef = useRef<string | null>(null);

  async function handleUpdateStatus(
    orderId: string,
    status: ServingOrderTargetStatus,
  ) {
    if (updatingOrderIdRef.current !== null) {
      if (import.meta.env.DEV) {
        console.debug("[restaurant-serving] duplicate status update blocked", {
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
        toast.error(response.message || "Failed to update serving order status");
        return;
      }

      await servingOrders.reload();

      toast.success("Order marked as served");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update serving order status"));
    } finally {
      updatingOrderIdRef.current = null;
      setUpdatingOrderId(null);
    }
  }

  return (
    <WorkspaceShell
      title="Restaurant Serving Workspace"
      description="Restaurant serving queue for moving ready orders to served through the canonical status API."
      currentRouteLabel="current Serving route"
      currentRoutePath={ROUTES.SERVING}
    >
      <ServingOrdersBoard
        errorMessage={servingOrders.errorMessage}
        isRefreshing={servingOrders.isRefreshing}
        onUpdateStatus={handleUpdateStatus}
        orders={servingOrders.orders}
        status={servingOrders.status}
        updatingOrderId={updatingOrderId}
      />
    </WorkspaceShell>
  );
}
