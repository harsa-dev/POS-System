# Restaurant Phase 3 - Backend route, guard, workflow preview

Status: implemented
Scope: Restaurant business mode only

## Goal

Expose a scoped Restaurant API surface without deleting or replacing the legacy F&B/order/menu/table routes yet.

This phase gives Restaurant mode its own read-only backend entry point and workflow preview routes. Write flows stay on legacy endpoints until the later write/reversal phases.

## Implemented endpoints

```text
GET /restaurant/health
GET /restaurant/dashboard
GET /restaurant/menu-items
GET /restaurant/tables
GET /restaurant/orders/active
GET /restaurant/kitchen
GET /restaurant/serving
GET /restaurant/workflow-preview
```

## Guard behavior

Every non-health endpoint uses:

```text
requireRole(..., RESTAURANT_READ_ROLES)
requireBusinessContextForUser(user)
businessContext.businessMode === "restaurant"
```

If the current business mode is not `restaurant`, the route returns `businessModeMismatch` with the expected and actual mode.

## Compatibility boundary

The following old surfaces remain mounted for now:

```text
/orders
/orders/status
/menu
/tables
/payments
features/restaurant/core-system/**
pages/dashboard/{checkout,kds,serving,orders,tables,menu,recipes,payments}.tsx
```

They are compatibility surfaces, not the canonical target.

## Canonical Restaurant route surface

The canonical backend route is now:

```text
artifacts/api-server/src/routes/restaurant.ts
```

It delegates through:

```text
restaurantService -> restaurantRepository -> restaurantPrismaRepository
```

## Validation

Run the scoped backend gate:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
```

Do not use full project typecheck as the Restaurant phase gate while unrelated non-restaurant modules are still noisy.

## Next phase

Phase 4 should add shared dashboard backend summary coverage around the Restaurant dashboard context and document how Restaurant plugs into shared dashboard surfaces without depending on legacy F&B naming.
