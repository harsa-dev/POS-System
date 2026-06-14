# Restaurant Business Mode Implementation Plan

Status: Phase 8H implemented
Scope owner: Restaurant business mode only

Restaurant mode is the canonical name for the old F&B flow. The old `features/fnb` area is treated as legacy compatibility until the Restaurant workspace/API surface is fully scoped.

## Phase tracker

```text
Phase 1  - Restaurant scope audit + F&B legacy mapping             Done
Phase 2  - Restaurant persistence foundation                       Done
Phase 3  - Backend route, guard, workflow preview                  Done
Phase 4  - Shared dashboard backend summary                        Done
Phase 5  - Seed restaurant/menu/table/order/payment demo data       Done
Phase 6  - Frontend Restaurant workspace API wiring                Done
Phase 7A - Prisma schema model mapping                             Done
Phase 7B - Summary read delegate                                   Done
Phase 7C - Workflow read delegate                                  Done
Phase 7D - Order/payment/kitchen/serving preview delegate           Done
Phase 7E - Order/write delegate                                    Done
Phase 7F - Guarded workflow status delegate                        Done
Phase 8A - Order/kitchen/serving/table status API route             Done
Phase 8B - Status frontend action                                  Done
Phase 8C - Order cancellation + stock/cashflow reversal workflow    Done
Phase 8D - Payment refund/void reversal workflow                   Done
Phase 8E - Generated API client consolidation                      Done
Phase 8F - Restaurant smoke test + scoped CI gate                   Done
Phase 8G - Migration baseline/idempotency hardening                Done
Phase 8H - Audit + permission policy hardening                     Done
Phase 8I - Restaurant audit controls frontend                      Next
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

## Phase 3 result

Restaurant now has a scoped read-only backend route mounted through the API router.

Implemented route file:

- `artifacts/api-server/src/routes/restaurant.ts`

Mounted in:
