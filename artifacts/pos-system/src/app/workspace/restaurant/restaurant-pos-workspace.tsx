import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantPosWorkspace() {
  return (
    <WorkspaceShell
      title="Restaurant POS Workspace"
      description="Skeleton route for the future V3 Restaurant POS workspace. The active cashier and checkout flow is still served by the current F&B dashboard route."
      currentRouteLabel="current Cashier route"
      currentRoutePath={ROUTES.CHECKOUT}
    />
  );
}
