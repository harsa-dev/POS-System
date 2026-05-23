// ---------------------------------------------------------------------------
// Centralised SSE event names — import from here in every route that broadcasts
// ---------------------------------------------------------------------------
export const REALTIME_EVENTS = {
  ORDER_CREATED: "order:created",
  ORDER_UPDATED: "order:updated",
  TABLE_UPDATED: "table:updated",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
