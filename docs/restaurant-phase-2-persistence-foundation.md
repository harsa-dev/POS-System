# Restaurant Phase 2 - Persistence Foundation

Status: implemented

## Scope

Phase 2 creates the scoped Restaurant backend persistence foundation. It does not replace legacy F&B/order/menu/table endpoints yet.

## Implemented backend files

```text
artifacts/api-server/src/services/restaurant/restaurant.types.ts
artifacts/api-server/src/services/restaurant/restaurant.repository.ts
artifacts/api-server/src/services/restaurant/restaurant.prisma-repository.ts
artifacts/api-server/src/services/restaurant/restaurant.repository-provider.ts
artifacts/api-server/src/services/restaurant/restaurant.service.ts
artifacts/api-server/src/services/restaurant/restaurant.policy.ts
artifacts/api-server/src/services/restaurant/restaurant.audit.ts
artifacts/api-server/tsconfig.restaurant.json
```

## Repository contract

The initial repository is read-focused:

- dashboard summary
- menu item list
- table list
- active order list
- kitchen queue
- serving queue

This mirrors the Retail track approach: create a scoped repository/service seam first, then move routes and workflows behind it phase by phase.

## Existing database foundation

No new migration is required in this phase. The current Prisma schema already includes Restaurant-mode base models:

- Business
- Restaurant
- Category
- MenuItem
- Recipe
- InventoryItem
- DiningTable
- Order
- OrderItem
- Payment
- Shift
- StockMovement
- AuditLog

## Permission foundation

`restaurant.policy.ts` defines explicit role groups:

- `RESTAURANT_READ_ROLES`
- `RESTAURANT_POS_ROLES`
- `RESTAURANT_MENU_MANAGEMENT_ROLES`
- `RESTAURANT_TABLE_MANAGEMENT_ROLES`
- `RESTAURANT_KITCHEN_ROLES`
- `RESTAURANT_SERVING_ROLES`
- `RESTAURANT_PAYMENT_ROLES`
- `RESTAURANT_REFUND_ROLES`
- `RESTAURANT_CANCELLATION_ROLES`

## Audit foundation

`restaurant.audit.ts` provides `buildRestaurantAuditPayload` with a normalized shape:

```text
event
actor
references
totals
status
reason
metadata
```

Write workflows will use this in later phases.

## Validation

Backend scoped validation command:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
```

This command intentionally validates Restaurant backend service foundation only. Full project typecheck remains out of scope.

## Next phase

Phase 3 should expose scoped Restaurant route endpoints while preserving old compatibility endpoints.
