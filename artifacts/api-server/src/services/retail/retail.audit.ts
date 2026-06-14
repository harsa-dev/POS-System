import type { RetailActor } from "./retail.types.js";

export type RetailAuditEvent =
  | "retail.checkout.created"
  | "retail.receiving.status_updated"
  | "retail.return.persisted"
  | "retail.sale.cancelled";

export type CreateRetailAuditPayloadInput = {
  event: RetailAuditEvent;
  actor: RetailActor;
  references?: Record<string, unknown>;
  totals?: Record<string, unknown>;
  stockMovementIds?: string[];
  reason?: string;
  metadata?: Record<string, unknown>;
};

export function createRetailAuditPayload(input: CreateRetailAuditPayloadInput) {
  return {
    event: input.event,
    actor: {
      id: input.actor.id,
      role: input.actor.role,
    },
    references: input.references ?? {},
    totals: input.totals ?? {},
    stockMovementIds: input.stockMovementIds ?? [],
    reason: input.reason,
    metadata: input.metadata ?? {},
  };
}
