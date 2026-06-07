import { ServingOrdersBoard } from "@/app/workspace/restaurant/serving/serving-orders-board";
import { useServingOrders } from "@/app/workspace/restaurant/serving/use-serving-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantServingWorkspace() {
  const servingOrders = useServingOrders();

  return (
    <WorkspaceShell
      title="Restaurant Serving Workspace"
      description="Read-only V3 serving queue for orders that are ready to be served. The active mutation workflow remains on the current F&B route."
      currentRouteLabel="current Serving route"
      currentRoutePath={ROUTES.SERVING}
    >
      <ServingOrdersBoard
        errorMessage={servingOrders.errorMessage}
        orders={servingOrders.orders}
        status={servingOrders.status}
      />
    </WorkspaceShell>
  );
}
