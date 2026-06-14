# Restaurant Historical Flow Mapping

Status: historical migration note

This file maps the old food-service POS flow into the canonical Restaurant business mode scope. `features/restaurant` is now the canonical feature folder; `fnb` naming should not be reintroduced in runtime code.

## Current finding

The project currently has:

1. New V3 Restaurant workspace code under `artifacts/pos-system/src/app/workspace/restaurant/**`.
2. Canonical Restaurant feature code under `artifacts/pos-system/src/features/restaurant/**`.
3. Transitional dashboard page targets under `artifacts/pos-system/src/pages/dashboard/**`.

The Restaurant workspace is already the canonical frontend direction, but some screens still point users back to dashboard fallback routes while the underlying flow is being migrated.

## Frontend mapping

| Current area | Target Restaurant area | Phase 1 decision |
| --- | --- | --- |
| `features/restaurant/core-system/server/pos/**` | `app/workspace/restaurant/pos/**` | Keep canonical feature implementation until POS workspace API wiring is complete. |
| `features/restaurant/core-system/menu/**` | `app/workspace/restaurant/menu/**` | Keep canonical feature implementation while menu/recipe workspace reaches parity. |
| `features/restaurant/core-system/kitchen/**` | `app/workspace/restaurant/kitchen/**` | Keep canonical feature implementation as fallback target. |
| `features/restaurant/core-system/server/serving/**` | `app/workspace/restaurant/serving/**` | Keep until status actions are API/client scoped. |
| `features/restaurant/core-system/server/orders/**` | `app/workspace/restaurant/orders/**` | Keep until order lifecycle actions use Restaurant API surface. |
| `features/restaurant/core-system/server/tables/**` | `app/workspace/restaurant/tables/**` | Keep until table status actions are scoped. |
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
6. Keep `features/restaurant` as the canonical Restaurant feature folder.

## Cleanup rule

A transitional Restaurant file can be deleted only after:

- it has a Restaurant replacement,
- it has no active imports,
- no route points to it,
- Restaurant smoke test covers the equivalent flow,
- and the deletion does not affect Retail/Raw Material scopes.
