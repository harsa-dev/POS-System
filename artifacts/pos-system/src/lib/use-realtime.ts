import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { REALTIME_EVENTS } from "./realtime-events";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface OrderEventData {
  id: string;
  orderNumber: number;
  status: string;
}

export interface TableEventData {
  id: string;
  status: string;
}

export interface UseRealtimeOptions {
  invalidateKeys?: string[][];
  onOrderCreated?: (data: OrderEventData) => void;
  onOrderUpdated?: (data: OrderEventData) => void;
  onTableUpdated?: (data: TableEventData) => void;
}

// ---------------------------------------------------------------------------
// useRealtime — manages a single SSE connection per component mount.
//
// Design decisions:
//   - Callbacks stored in refs so the effect only runs once (no dep-churn).
//   - Exponential backoff capped at 30 s on disconnect.
//   - Cleanup runs on unmount: closes EventSource, clears timers.
//   - invalidateKeys triggers queryClient.invalidateQueries on every event so
//     existing TanStack Query fetches stay as the single source of truth.
// ---------------------------------------------------------------------------
export function useRealtime(options: UseRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  // Stable refs — update every render, effect reads them without re-running
  const onOrderCreatedRef = useRef(options.onOrderCreated);
  const onOrderUpdatedRef = useRef(options.onOrderUpdated);
  const onTableUpdatedRef = useRef(options.onTableUpdated);
  const invalidateKeysRef = useRef(options.invalidateKeys ?? []);

  onOrderCreatedRef.current = options.onOrderCreated;
  onOrderUpdatedRef.current = options.onOrderUpdated;
  onTableUpdatedRef.current = options.onTableUpdated;
  invalidateKeysRef.current = options.invalidateKeys ?? [];

  useEffect(() => {
    let unmounted = false;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 2000;

    function invalidate() {
      for (const key of invalidateKeysRef.current) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    }

    function connect() {
      if (unmounted) return;
      setStatus("connecting");

      es = new EventSource("/api/events", { withCredentials: true });

      es.addEventListener("connected", () => {
        if (unmounted) return;
        setStatus("connected");
        reconnectDelay = 2000;
      });

      es.addEventListener(REALTIME_EVENTS.ORDER_CREATED, (e: MessageEvent) => {
        if (unmounted) return;
        const data = JSON.parse(e.data) as OrderEventData;
        invalidate();
        onOrderCreatedRef.current?.(data);
      });

      es.addEventListener(REALTIME_EVENTS.ORDER_UPDATED, (e: MessageEvent) => {
        if (unmounted) return;
        const data = JSON.parse(e.data) as OrderEventData;
        invalidate();
        onOrderUpdatedRef.current?.(data);
      });

      es.addEventListener(REALTIME_EVENTS.TABLE_UPDATED, (e: MessageEvent) => {
        if (unmounted) return;
        const data = JSON.parse(e.data) as TableEventData;
        invalidate();
        onTableUpdatedRef.current?.(data);
      });

      es.onerror = () => {
        if (unmounted) return;
        setStatus("disconnected");
        es?.close();
        es = null;
        // Exponential backoff, capped at 30 s
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
          connect();
        }, reconnectDelay);
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      es?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status };
}
