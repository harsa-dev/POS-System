import type { Prisma, Role } from "@prisma/client";

export const RESTAURANT_AUDIT_EVENT_REGISTRY = {
  "restaurant.order.created": {
    category: "order",
    severity: "info",
    requiresReason: false,
  },
  "restaurant.payment.confirmed": {
    category: "payment",
    severity: "info",
    requiresReason: false,
  },
  "restaurant.workflow.status_updated": {
    category: "workflow",
    severity: "info",
    requiresReason: false,
  },
  "restaurant.workflow.order_cancelled": {
    category: "order",
    severity: "warning",
    requiresReason: true,
  },
  "restaurant.payment.refunded": {
    category: "payment",
    severity: "warning",
    requiresReason: true,
  },
  "restaurant.payment.voided": {
    category: "payment",
    severity: "warning",
    requiresReason: true,
  },
} as const;

export type RestaurantAuditEvent = keyof typeof RESTAURANT_AUDIT_EVENT_REGISTRY;
export type RestaurantAuditCategory = typeof RESTAURANT_AUDIT_EVENT_REGISTRY[RestaurantAuditEvent]["category"];
export type RestaurantAuditSeverity = typeof RESTAURANT_AUDIT_EVENT_REGISTRY[RestaurantAuditEvent]["severity"];

type RestaurantAuditActor = {
  userId: string;
  role: Role;
};

type RestaurantAuditInput = {
  event: RestaurantAuditEvent;
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

export function getRestaurantAuditEventDefinition(event: RestaurantAuditEvent) {
  return RESTAURANT_AUDIT_EVENT_REGISTRY[event];
}

export function getRestaurantAuditEventKeys() {
  return Object.keys(RESTAURANT_AUDIT_EVENT_REGISTRY) as RestaurantAuditEvent[];
}

export function buildRestaurantAuditPayload(input: RestaurantAuditInput) {
  const definition = getRestaurantAuditEventDefinition(input.event);

  return toPrismaJsonObject({
    event: input.event,
    category: definition.category,
    severity: definition.severity,
    requiresReason: definition.requiresReason,
    reasonQuality: definition.requiresReason && !input.reason ? "missing" : "provided_or_not_required",
    actor: input.actor,
    references: input.references ?? {},
    totals: input.totals ?? {},
    status: input.status ?? {},
    reason: input.reason ?? null,
    metadata: input.metadata ?? {},
  });
}
