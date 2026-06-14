# Restaurant Phase 6 - Frontend API Wiring

Status: implemented

## Goal

Move Restaurant V3 frontend read/list surfaces from legacy F&B/general endpoints to the scoped Restaurant API introduced in Phase 3.

This phase does not replace status mutations yet. Order status actions stay on the legacy order API until the guarded Restaurant status routes are implemented in later phases.

## Implemented API client

- `artifacts/pos-system/src/lib/api/restaurant-api.ts`

The client exposes typed wrappers for:

- `GET /restaurant/health`
- `GET /restaurant/dashboard`
- `GET /restaurant/shared-dashboard/:dashboardId`
- `GET /restaurant/menu-items`
- `GET /restaurant/tables`
- `GET /restaurant/orders/active`
- `GET /restaurant/kitchen`
- `GET /restaurant/serving`
- `GET /restaurant/workflow-preview`

## Updated workspaces

The following Restaurant read/list hooks now use `restaurantApi`:

- POS menu catalog: `src/app/workspace/restaurant/pos/use-pos-menu-catalog.ts`
- Menu catalog: `src/app/workspace/restaurant/menu/use-menu-workspace-catalog.ts`
- Tables: `src/app/workspace/restaurant/tables/use-tables-workspace-tables.ts`
- Orders: `src/app/workspace/restaurant/orders/use-orders-workspace-orders.ts`
- Kitchen queue: `src/app/workspace/restaurant/kitchen/use-kitchen-orders.ts`
- Serving queue: `src/app/workspace/restaurant/serving/use-serving-orders.ts`

## Compatibility boundary

Still legacy for now:

- Order creation.
- Order status mutation.
- Kitchen status update.
- Serving status update.
- Payment mutation.
- Order cancellation/refund.

These are intentionally deferred to workflow/write phases so the read migration stays small and safe.

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Manual UI check after server is running:

- Restaurant POS menu should load from seeded menu items.
- Restaurant menu board should show backend items/categories.
- Tables workspace should show backend dining tables.
- Orders workspace should show active orders.
- Kitchen workspace should show paid/preparing queue.
- Serving workspace should show ready queue.
