import type { Prisma, Role } from "@prisma/client";

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

function toPrismaJsonObject(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

export function buildRestaurantAuditPayload(input: RestaurantAuditInput) {
  return toPrismaJsonObject({
    event: input.event,
    actor: input.actor,
    references: input.references ?? {},
    totals: input.totals ?? {},
    status: input.status ?? {},
    reason: input.reason ?? null,
    metadata: input.metadata ?? {},
  });
}
