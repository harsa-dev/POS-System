# Phase 8H - Audit + Permission Policy Hardening

## Goal

Harden Restaurant write surfaces by turning role access and audit events into explicit contracts instead of scattered strings and role arrays.

This phase does not add new operational write behavior. It improves the guardrails around existing Restaurant order, workflow, cancellation, payment, refund, and void flows.

## Implemented backend contracts

### Permission capability matrix

`artifacts/api-server/src/services/restaurant/restaurant.policy.ts` now defines a named capability matrix:

- `restaurant:read`
- `restaurant:dashboard:read`
- `restaurant:shared-dashboard:read`
- `restaurant:menu:read`
- `restaurant:menu:manage`
- `restaurant:table:read`
- `restaurant:table:manage`
- `restaurant:order:read`
- `restaurant:order:create`
- `restaurant:order:cancel`
- `restaurant:workflow:preview`
- `restaurant:workflow:update`
- `restaurant:kitchen:update`
- `restaurant:serving:update`
- `restaurant:payment:preview`
- `restaurant:payment:confirm`
- `restaurant:payment:refund`
- `restaurant:payment:void`
- `restaurant:audit:read`
- `restaurant:policy:read`

Existing role arrays still exist for compatibility, but they are now derived from the capability matrix.

### Audit event registry

`artifacts/api-server/src/services/restaurant/restaurant.audit.ts` now defines the canonical audit event registry:

- `restaurant.order.created`
- `restaurant.payment.confirmed`
- `restaurant.workflow.status_updated`
- `restaurant.workflow.order_cancelled`
- `restaurant.payment.refunded`
- `restaurant.payment.voided`

Each event has:

- category
- severity
- requiresReason

`buildRestaurantAuditPayload` now includes the category, severity, reason requirement, and reason quality in the JSON payload.

### Security policy route

New route:

```txt
GET /api/restaurant/security/policy
```

This endpoint returns:

- current viewer
- Restaurant permission matrix
- audit event registry

It is read-only and restricted to Restaurant policy roles.

## Frontend client

New client file:

```txt
artifacts/pos-system/src/lib/api/restaurant-security-api.ts
```

It exposes:

```ts
restaurantSecurityApi.getSecurityPolicy()
```

The client is exported from `@/lib/api`.

## Validation

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Optional runtime check with an owner/admin session:

```txt
GET /api/restaurant/security/policy
```

## Non-goals

- No new user/employee UI.
- No audit log listing UI yet.
- No role editing UI yet.
- No permission migration for non-Restaurant modes.
- No deletion of legacy F&B permissions.

## Next phase

Phase 8I should wire the frontend audit controls dashboard to the security policy route and prepare an audit log viewer surface.
