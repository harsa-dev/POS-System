# Restaurant Legacy F&B Mapping

Status: Phase 1 audit complete

This file maps the old F&B/restaurant code into the new Restaurant business mode scope. The goal is not to delete old code immediately. The goal is to identify what becomes canonical Restaurant code, what remains a compatibility bridge, and what can be removed later.

## Current finding

The project currently has both:

1. New V3 Restaurant workspace code under `artifacts/pos-system/src/app/workspace/restaurant/**`.
2. Legacy F&B feature/page code under `artifacts/pos-system/src/features/fnb/**` and `artifacts/pos-system/src/pages/dashboard/**`.

The Restaurant workspace is already the canonical frontend direction, but some screens still point users back to current F&B/dashboard routes while the underlying flow is being migrated.

## Frontend mapping

| Legacy / current area | Target Restaurant area | Phase 1 decision |
| --- | --- | --- |
| `features/fnb/core-system/server/pos/**` | `app/workspace/restaurant/pos/**` | Keep legacy until POS API wiring is complete. |
| `features/fnb/core-system/menu/**` | `app/workspace/restaurant/menu/**` | Keep legacy while menu/recipe workspace reaches parity. |
| `features/fnb/core-system/kitchen/**` | `app/workspace/restaurant/kitchen/**` | Keep legacy route as compatibility target. |
| `features/fnb/core-system/server/serving/**` | `app/workspace/restaurant/serving/**` | Keep until status actions are API/client scoped. |
| `features/fnb/core-system/server/orders/**` | `app/workspace/restaurant/orders/**` | Keep until order lifecycle actions use Restaurant API surface. |
| `features/fnb/core-system/server/tables/**` | `app/workspace/restaurant/tables/**` | Keep until table status actions are scoped. |
| `pages/dashboard/checkout.tsx` | `restaurant-pos-workspace.tsx` | Current route target / compatibility. |
| `pages/dashboard/kds.tsx` | `restaurant-kitchen-workspace.tsx` | Current route target / compatibility. |
| `pages/dashboard/serving.tsx` | `restaurant-serving-workspace.tsx` | Current route target / compatibility. |
| `pages/dashboard/orders.tsx` | `restaurant-orders-workspace.tsx` | Current route target / compatibility. |
| `pages/dashboard/tables.tsx` | `restaurant-tables-workspace.tsx` | Current route target / compatibility. |
| `pages/dashboard/menu.tsx` | `restaurant-menu-workspace.tsx` | Current route target / compatibility. |
| `pages/dashboard/recipes.tsx` | `restaurant-recipes-workspace.tsx` | Current route target / compatibility. |
| `pages/dashboard/payments.tsx` | Restaurant payment workspace / shared payment area | Needs Phase 2/3 decision. |

## Backend mapping

| Existing area | Target Restaurant area | Phase 1 decision |
| --- | --- | --- |
| `src/routes/orders.ts` | `src/routes/restaurant.ts` or `src/routes/restaurant/orders.ts` | Keep, wrap through Restaurant route later. |
| `src/routes/orders-status.ts` | `services/restaurant/restaurant.workflow-status.repository.ts` | Keep, extract guarded workflow later. |
| `src/services/orders/**` | `src/services/restaurant/**` | Keep, progressively move into Restaurant service layer. |
| payment/order helpers | `restaurant.prisma-repository.ts` + `restaurant.service.ts` | Planned. |
| inventory recipe deduction logic | Restaurant stock/write delegate | Planned. |

## Database mapping

Existing Prisma models already cover the core Restaurant domain:

- `Business`
- `Restaurant`
- `Category`
- `MenuItem`
- `InventoryItem`
- `Recipe`
- `Order`
- `OrderItem`
- `Payment`
- `DiningTable`
- `Shift`
- `StockMovement`
- `CashflowEntry`
- `AuditLog`

Phase 2 must verify if these models are already enough for the scoped Restaurant repository or if a small idempotent SQL hardening script is needed.

## Canonical Restaurant contracts to create

Backend service layer:

```text
restaurant.types.ts
restaurant.repository.ts
restaurant.prisma-repository.ts
restaurant.repository-provider.ts
restaurant.service.ts
restaurant.policy.ts
restaurant.audit.ts
restaurant.workflow-status.repository.ts
```

Routes:

```text
GET    /api/restaurant/health
GET    /api/restaurant/dashboard
GET    /api/restaurant/menu
GET    /api/restaurant/tables
GET    /api/restaurant/orders
GET    /api/restaurant/kitchen
GET    /api/restaurant/serving
POST   /api/restaurant/orders/preview
POST   /api/restaurant/orders/checkout
PATCH  /api/restaurant/orders/:id/status
POST   /api/restaurant/orders/:id/cancel
POST   /api/restaurant/payments/:id/refund
```

## Phase 2 recommendations

1. Create Restaurant backend service skeleton.
2. Add repository interface based on existing models.
3. Add read-only dashboard/menu/table/order DTOs first.
4. Keep old routes untouched while the Restaurant route is introduced.
5. Add `typecheck:restaurant` configs only after service files exist.
6. Avoid deleting `features/fnb` until Restaurant smoke gate passes.

## Cleanup rule

A legacy F&B file can be deleted only after:

- it has a Restaurant replacement,
- it has no active imports,
- no route points to it,
- Restaurant smoke test covers the equivalent flow,
- and the deletion does not affect Retail/Raw Material scopes.
