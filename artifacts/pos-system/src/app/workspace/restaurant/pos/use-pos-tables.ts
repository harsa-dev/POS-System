import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { v3PosTables } from "@/app/workspace/restaurant/pos-sample-data";
import type {
  PosTableItem,
  PosTableSummary,
} from "@/app/workspace/restaurant/pos/pos-workspace-types";
import { restaurantClient, type RestaurantTableDto } from "@/lib/api";

type PosTablesStatus = "loading" | "ready" | "error";

type PosTablesState = {
  tables: PosTableItem[];
  summary: PosTableSummary;
  status: PosTablesStatus;
  errorMessage: string | null;
  isUsingFallback: boolean;
  isRefreshing: boolean;
  reload: () => void;
};

const fallbackTables: PosTableItem[] = v3PosTables.map((table) => ({
  id: table.id,
  name: table.name,
  capacity: table.capacity,
  status: table.status,
}));

function mapDiningTableToPosTable(table: RestaurantTableDto): PosTableItem {
  return {
    id: table.id,
    name: table.name,
    capacity: table.capacity,
    status: table.status,
  };
}

function createTableSummary(tables: PosTableItem[]): PosTableSummary {
  return tables.reduce<PosTableSummary>(
    (summary, table) => ({
      total: summary.total + 1,
      available:
        summary.available + (table.status === "AVAILABLE" ? 1 : 0),
      occupied: summary.occupied + (table.status === "OCCUPIED" ? 1 : 0),
      reserved: summary.reserved + (table.status === "RESERVED" ? 1 : 0),
      cleaning: summary.cleaning + (table.status === "CLEANING" ? 1 : 0),
    }),
    {
      total: 0,
      available: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0,
    },
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Table status is unavailable. Showing static preview data.";
}

export function usePosTables(): PosTablesState {
  const [tables, setTables] = useState<PosTableItem[]>([]);
  const [status, setStatus] = useState<PosTablesStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const hasLoadedOnceRef = useRef(false);

  const reload = useCallback(() => {
    setReloadVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTables() {
      const isBackgroundRefresh = hasLoadedOnceRef.current;
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setStatus("loading");
      }
      setErrorMessage(null);

      try {
        const response = await restaurantClient.listTables();
        if (!isMounted) return;

        if (!response.success) {
          throw new Error(response.message ?? "Failed to load restaurant tables");
        }

        const activeTables = (response.data ?? []).filter(
          (table) => table.isActive !== false,
        );
        setTables(activeTables.map(mapDiningTableToPosTable));
        setIsUsingFallback(false);
        hasLoadedOnceRef.current = true;
        setStatus("ready");
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(getErrorMessage(error));
        if (hasLoadedOnceRef.current) {
          setStatus("ready");
        } else {
          setTables(fallbackTables);
          setIsUsingFallback(true);
          setStatus("error");
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    }

    void loadTables();

    return () => {
      isMounted = false;
    };
  }, [reloadVersion]);

  const summary = useMemo(() => createTableSummary(tables), [tables]);

  return useMemo(
    () => ({
      tables,
      summary,
      status,
      errorMessage,
      isUsingFallback,
      isRefreshing,
      reload,
    }),
    [errorMessage, isRefreshing, isUsingFallback, reload, status, summary, tables],
  );
}
