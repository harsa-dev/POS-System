import { KitchenOrdersBoard } from "@/app/workspace/restaurant/kitchen/kitchen-orders-board";
import { useKitchenOrders } from "@/app/workspace/restaurant/kitchen/use-kitchen-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantKitchenWorkspace() {
  const kitchenOrders = useKitchenOrders();

  return (
    <WorkspaceShell
      title="Restaurant Kitchen Workspace"
      description="Read-only V3 Restaurant Kitchen workspace for reviewing paid and preparing orders. The active kitchen display system remains on the current F&B route."
      currentRouteLabel="current Kitchen route"
      currentRoutePath={ROUTES.KDS}
    >
      <KitchenOrdersBoard
        errorMessage={kitchenOrders.errorMessage}
        orders={kitchenOrders.orders}
        status={kitchenOrders.status}
      />
    </WorkspaceShell>
  );
}
