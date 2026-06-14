# Restaurant Business Mode Implementation Plan

Status: Phase 2 implemented
Scope owner: Restaurant business mode only

Restaurant mode is the canonical name for the old F&B flow. The old `features/fnb` area is treated as legacy compatibility until the Restaurant workspace/API surface is fully scoped.

## Phase tracker

```text
Phase 1  - Restaurant scope audit + F&B legacy mapping             Done
Phase 2  - Restaurant persistence foundation                       Done
Phase 3  - Backend route, guard, workflow preview                  Next
Phase 4  - Shared dashboard backend summary                        Planned
Phase 5  - Seed restaurant/menu/table/order/payment demo data       Planned
Phase 6  - Frontend Restaurant workspace API wiring                Planned
Phase 7A - Prisma schema model mapping                             Planned
Phase 7B - Summary read delegate                                   Planned
Phase 7C - Workflow read delegate                                  Planned
Phase 7D - Order/payment/kitchen/serving preview delegate           Planned
Phase 7E - Order/write delegate                                    Planned
Phase 7F - Guarded workflow status delegate                        Planned
Phase 8A - Order/kitchen/serving/table status API route             Planned
Phase 8B - Status frontend action                                  Planned
Phase 8C - Order cancellation + stock/cashflow reversal workflow    Planned
Phase 8D - Payment refund/void reversal workflow                   Planned
Phase 8E - Generated API client consolidation                      Planned
Phase 8F - Restaurant smoke test + scoped CI gate                   Planned
Phase 8G - Migration baseline/idempotency hardening                Planned
Phase 8H - Audit + permission policy hardening                     Planned
```

## Phase 1 result

Restaurant mode already has a newer V3 frontend workspace under `artifacts/pos-system/src/app/workspace/restaurant`. The active POS/kitchen/serving/order flow still depends on old dashboard/API pieces in several places, so the next work is not a blind rewrite. The migration strategy is to keep compatibility first, then move backend and frontend into scoped Restaurant contracts.

Observed frontend workspace areas:

- POS workspace shell and POS table/open-order/menu modules.
- Menu and recipes workspaces.
- Tables workspace.
- Kitchen workspace.
- Serving workspace.
- Orders workspace.
- Shared Restaurant status and feedback helpers.

Observed legacy areas that must not be deleted yet:

- `artifacts/pos-system/src/features/fnb/core-system/**`
- `artifacts/pos-system/src/pages/dashboard/{checkout,kds,serving,orders,tables,menu,recipes,payments}.tsx`
- old `@/lib/api` restaurant/order/payment/table helpers used by V3 Restaurant workspace.
- API server order/status/payment/menu/table/inventory routes and services.

## Phase 2 result

Restaurant now has a scoped backend persistence foundation under `artifacts/api-server/src/services/restaurant/**`.

Implemented files:

- `restaurant.types.ts`
- `restaurant.repository.ts`
- `restaurant.prisma-repository.ts`
- `restaurant.repository-provider.ts`
- `restaurant.service.ts`
- `restaurant.policy.ts`
- `restaurant.audit.ts`
- `tsconfig.restaurant.json`

The foundation is read-focused and intentionally does not replace legacy order/menu/table routes yet. It provides one canonical Restaurant repository/service surface for dashboard summary, menu items, tables, active orders, kitchen queue, and serving queue. Write flows stay in legacy endpoints until Phase 7E/8C/8D.

## Canonical target layout

Frontend target:

```text
artifacts/pos-system/src/app/workspace/restaurant/
  restaurant-pos-workspace.tsx
  restaurant-menu-workspace.tsx
  restaurant-recipes-workspace.tsx
  restaurant-tables-workspace.tsx
  restaurant-kitchen-workspace.tsx
  restaurant-serving-workspace.tsx
  restaurant-orders-workspace.tsx
  pos/
  menu/
  tables/
  kitchen/
  serving/
  orders/
  shared/
```

Backend target:

```text
artifacts/api-server/src/services/restaurant/
  restaurant.types.ts
  restaurant.repository.ts
  restaurant.prisma-repository.ts
  restaurant.repository-provider.ts
  restaurant.service.ts
  restaurant.policy.ts
  restaurant.audit.ts
  restaurant.workflow-status.repository.ts

artifacts/api-server/src/routes/restaurant.ts
```

Client target:

```text
lib/api-spec/openapi.yaml
lib/api-client-react/src/generated/api.schemas.ts
lib/api-client-react/src/generated/api.ts
```

Validation target:

```text
pnpm restaurant:check
pnpm restaurant:smoke
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

## Phase 3 next actions

1. Add scoped `routes/restaurant.ts` read endpoints.
2. Mount the Restaurant route under API router.
3. Keep old `/orders`, `/menu-items`, `/tables` endpoints alive as compatibility.
4. Use `RESTAURANT_*_ROLES` policy for scoped endpoints.
5. Add simple workflow preview endpoints for active orders, kitchen queue, and serving queue.

## Non-goals for the Restaurant track

- Do not touch Retail implementation unless a shared client export breaks Restaurant.
- Do not refactor Raw Material.
- Do not delete legacy F&B files until scoped Restaurant routes and frontend wiring are stable.
