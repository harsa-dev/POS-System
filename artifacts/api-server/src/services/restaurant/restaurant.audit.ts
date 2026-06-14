import type { Role } from "@prisma/client";

type RestaurantAuditActor = {
  userId: string;
  role: Role;
};

type RestaurantAuditInput = {
  event: string;
  actor: RestaurantAuditActor;
  references?: Record<string, unknown>;
  totals?: Record<string, number>;
  status?: {
    from?: string | null;
    to?: string | null;
  };
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export function buildRestaurantAuditPayload(input: RestaurantAuditInput) {
  return {
    event: input.event,
    actor: input.actor,
    references: input.references ?? {},
    totals: input.totals ?? {},
    status: input.status ?? {},
    reason: input.reason ?? null,
    metadata: input.metadata ?? {},
  };
}
