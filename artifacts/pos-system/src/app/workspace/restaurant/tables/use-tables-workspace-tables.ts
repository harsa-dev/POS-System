import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { tablesApi } from "@/lib/api";
import {
  normalizeRestaurantTableStatus,
  restaurantTableStatusLabels,
  type RestaurantTableStatus,
} from "@/app/workspace/restaurant/shared/restaurant-workspace-status";

export type TablesWorkspaceStatus = RestaurantTableStatus;

export type TablesWorkspaceTable = {
  id: string;
  name: string;
  capacity: number;
  status: TablesWorkspaceStatus;
  statusLabel: string;
  isActive: boolean;
  activeLabel: string;
};

type TablesWorkspaceState = "loading" | "ready" | "error";

type TablesWorkspaceResult = {
  tables: TablesWorkspaceTable[];
  status: TablesWorkspaceState;
  errorMessage: string | null;
  isRefreshing: boolean;
  reload: () => Promise<void>;
};

type TableResponse = {
  id: string;
  name: string;
  capacity?: number | null;
  status?: string | null;
  isActive?: boolean | null;
};

function mapTableToWorkspaceTable(
  table: TableResponse,
): TablesWorkspaceTable {
  const status = normalizeRestaurantTableStatus(table.status);
  const isActive = table.isActive ?? true;

  return {
    id: table.id,
    name: table.name,
    capacity: table.capacity ?? 0,
    status,
    statusLabel: restaurantTableStatusLabels[status],
    isActive,
    activeLabel: isActive ? "Active" : "Inactive",
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Tables are unavailable.";
}

export function useTablesWorkspaceTables(): TablesWorkspaceResult {
  const [tables, setTables] = useState<TablesWorkspaceTable[]>([]);
  const [status, setStatus] = useState<TablesWorkspaceState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const loadTables = useCallback(async () => {
    const isBackgroundRefresh = hasLoadedOnceRef.current;
    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
    }
    setErrorMessage(null);

    try {
      const response = await tablesApi.list<TableResponse[]>();

      if (!response.success) {
        throw new Error(response.message ?? "Failed to load tables");
      }

      const mappedTables = (response.data ?? [])
        .map(mapTableToWorkspaceTable)
        .sort((left, right) =>
          left.name.localeCompare(right.name, undefined, { numeric: true }),
        );

      setTables(mappedTables);
      hasLoadedOnceRef.current = true;
      setStatus("ready");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      if (hasLoadedOnceRef.current) {
        setStatus("ready");
      } else {
        setTables([]);
        setStatus("error");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  return useMemo(
    () => ({
      tables,
      status,
      errorMessage,
      isRefreshing,
      reload: loadTables,
    }),
    [errorMessage, isRefreshing, loadTables, status, tables],
  );
}
