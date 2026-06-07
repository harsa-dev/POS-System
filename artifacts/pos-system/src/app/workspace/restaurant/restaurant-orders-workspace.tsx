import { OrdersWorkspaceBoard } from "@/app/workspace/restaurant/orders/orders-workspace-board";
import { useOrdersWorkspaceOrders } from "@/app/workspace/restaurant/orders/use-orders-workspace-orders";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantOrdersWorkspace() {
  const orders = useOrdersWorkspaceOrders();

  return (
    <WorkspaceShell
      title="Restaurant Orders Workspace"
      description="Read-only V3 order lifecycle workspace for observing orders across POS, kitchen, serving, and closure states."
      currentRouteLabel="current Orders route"
      currentRoutePath={ROUTES.ORDERS}
    >
      <OrdersWorkspaceBoard
        errorMessage={orders.errorMessage}
        orders={orders.orders}
        status={orders.status}
      />
    </WorkspaceShell>
  );
}
