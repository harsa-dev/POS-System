// ---------------------------------------------------------------------------
// Centralised SSE event names — mirrors api-server/src/lib/realtime-events.ts
// Keep both files in sync when adding new events.
// ---------------------------------------------------------------------------
export const REALTIME_EVENTS = {
  ORDER_CREATED: "order:created",
  ORDER_UPDATED: "order:updated",
  TABLE_UPDATED: "table:updated",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
