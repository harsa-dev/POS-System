import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantTablesWorkspace() {
  return (
    <WorkspaceShell
      title="Restaurant Tables Workspace"
      description="Skeleton route for the future V3 Restaurant Tables workspace. The active table management workflow remains on the current F&B route."
      currentRouteLabel="current Tables route"
      currentRoutePath={ROUTES.TABLES}
    />
  );
}
