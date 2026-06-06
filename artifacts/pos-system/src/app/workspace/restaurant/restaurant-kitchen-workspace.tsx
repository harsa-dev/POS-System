import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantKitchenWorkspace() {
  return (
    <WorkspaceShell
      title="Restaurant Kitchen Workspace"
      description="Skeleton route for the future V3 Restaurant Kitchen workspace. The active kitchen display system remains on the current F&B route."
      currentRouteLabel="current Kitchen route"
      currentRoutePath={ROUTES.KDS}
    />
  );
}
