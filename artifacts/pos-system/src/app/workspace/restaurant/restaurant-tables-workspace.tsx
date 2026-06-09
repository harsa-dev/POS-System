import { useRef, useState } from "react";
import { toast } from "sonner";

import { TablesWorkspaceBoard } from "@/app/workspace/restaurant/tables/tables-workspace-board";
import {
  type TablesWorkspaceTable,
  useTablesWorkspaceTables,
} from "@/app/workspace/restaurant/tables/use-tables-workspace-tables";
import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage, tablesApi } from "@/lib/api";

export default function RestaurantTablesWorkspace() {
  const tables = useTablesWorkspaceTables();
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);
  const updatingTableIdRef = useRef<string | null>(null);

  async function handleMarkClean(table: TablesWorkspaceTable) {
    if (table.status !== "CLEANING") return;

    if (updatingTableIdRef.current !== null) {
      if (import.meta.env.DEV) {
        console.debug("[tables-v3] duplicate mark-clean blocked", {
          activeTableId: updatingTableIdRef.current,
          tableId: table.id,
        });
      }

      return;
    }

    updatingTableIdRef.current = table.id;
    setUpdatingTableId(table.id);

    try {
      const result = await tablesApi.markCleanWithResult(table.id);

      if (!result.ok || !result.body.success) {
        toast.error(
          result.body.message ||
            `Failed to mark table clean (${result.status})`,
        );
        return;
      }

      await tables.reload();

      toast.success("Table marked clean and available.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to mark table clean"));
    } finally {
      updatingTableIdRef.current = null;
      setUpdatingTableId(null);
    }
  }

  return (
    <WorkspaceShell
      title="Restaurant Tables Workspace"
      description="Read-only V3 table lifecycle workspace for observing available, occupied, cleaning, and reserved table states."
      currentRouteLabel="current Tables route"
      currentRoutePath={ROUTES.TABLES}
    >
      <TablesWorkspaceBoard
        errorMessage={tables.errorMessage}
        isRefreshing={tables.isRefreshing}
        onMarkClean={handleMarkClean}
        status={tables.status}
        tables={tables.tables}
        updatingTableId={updatingTableId}
      />
    </WorkspaceShell>
  );
}
