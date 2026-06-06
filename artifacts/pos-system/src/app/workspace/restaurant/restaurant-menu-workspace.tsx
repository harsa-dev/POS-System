import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantMenuWorkspace() {
  return (
    <WorkspaceShell
      title="Restaurant Menu Workspace"
      description="Skeleton route for the future V3 Restaurant Menu workspace. The active menu and recipe management workflow remains on the current F&B route."
      currentRouteLabel="current Menu route"
      currentRoutePath={ROUTES.MENU}
    />
  );
}
