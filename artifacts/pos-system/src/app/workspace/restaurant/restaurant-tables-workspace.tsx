import { TablesWorkspaceBoard } from "@/app/workspace/restaurant/tables/tables-workspace-board";
import { useTablesWorkspaceTables } from "@/app/workspace/restaurant/tables/use-tables-workspace-tables";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";

export default function RestaurantTablesWorkspace() {
  const tables = useTablesWorkspaceTables();

  return (
    <WorkspaceShell
      title="Restaurant Tables Workspace"
      description="Read-only V3 table lifecycle workspace for observing available, occupied, cleaning, and reserved table states."
      currentRouteLabel="current Tables route"
      currentRoutePath={ROUTES.TABLES}
    >
      <TablesWorkspaceBoard
        errorMessage={tables.errorMessage}
        status={tables.status}
        tables={tables.tables}
      />
    </WorkspaceShell>
  );
}
