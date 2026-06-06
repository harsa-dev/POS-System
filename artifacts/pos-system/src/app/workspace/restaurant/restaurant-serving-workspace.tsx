import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantServingWorkspace() {
  return (
    <WorkspaceShell
      title="Restaurant Serving Workspace"
      description="Skeleton route for the future V3 Restaurant Serving workspace. The active serving queue remains on the current F&B route."
      currentRouteLabel="current Serving route"
      currentRoutePath={ROUTES.SERVING}
    />
  );
}
