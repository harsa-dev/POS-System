# Restaurant Phase 7B - Summary Read Delegate

Status: implemented
Scope: Restaurant business mode only

## Goal

Strengthen `/api/restaurant/dashboard` so the Restaurant workspace has a stable backend summary instead of a few basic counts.

This phase is read-only.

## Implemented files

- `artifacts/api-server/src/services/restaurant/restaurant.types.ts`
- `artifacts/api-server/src/services/restaurant/restaurant.prisma-repository.ts`
- `artifacts/pos-system/src/lib/api/restaurant-api.ts`
- `docs/restaurant-next-implementation-plan.md`

## Compatibility

Existing `totals` and `sales` fields stay available.

New additive sections:

- `generatedAt`
- `window`
- `payments`
- `operations`
- `inventory`
- `health`

## Delegate behavior

The summary delegate now derives data from Restaurant settings, menu items, recipes, dining tables, orders, payments, and inventory items.

It computes:

- today revenue and paid revenue
- active order value
- pending payment value
- payment totals by method
- order counts by status
- table occupancy rate
- kitchen and serving queue age
- low-stock and out-of-stock risk
- recipe-linked menu coverage
- overall health signals

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

## Out of scope

No new migration, mutation route, cancellation, payment reversal, or global frontend cleanup was added in this phase.
