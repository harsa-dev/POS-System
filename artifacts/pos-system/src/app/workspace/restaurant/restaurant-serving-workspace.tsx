import { useRef, useState } from "react";
import { toast } from "sonner";

import { ServingOrdersBoard } from "@/app/workspace/restaurant/serving/serving-orders-board";
import {
  type ServingOrderTargetStatus,
  useServingOrders,
} from "@/app/workspace/restaurant/serving/use-serving-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage, orderApi } from "@/lib/api";

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
        console.debug("[serving-v3] duplicate status update blocked", {
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
      const result = await orderApi.updateStatusWithResult(orderId, {
        status,
      });

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message ||
            `Failed to update order status (${result.status})`,
        );
        return;
      }

      await servingOrders.reload();

      toast.success("Order marked as served");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update order status"));
    } finally {
      updatingOrderIdRef.current = null;
      setUpdatingOrderId(null);
    }
  }

  return (
    <WorkspaceShell
      title="Restaurant Serving Workspace"
      description="Read-only V3 serving queue for orders that are ready to be served. The active mutation workflow remains on the current F&B route."
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
