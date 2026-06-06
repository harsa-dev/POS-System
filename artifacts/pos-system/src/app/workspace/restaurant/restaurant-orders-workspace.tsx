import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantOrdersWorkspace() {
  return (
    <WorkspaceShell
      title="Restaurant Orders Workspace"
      description="Skeleton route for the future V3 Restaurant Orders workspace. The active order management workflow remains on the current F&B route."
      currentRouteLabel="current Orders route"
      currentRoutePath={ROUTES.ORDERS}
    />
  );
}
