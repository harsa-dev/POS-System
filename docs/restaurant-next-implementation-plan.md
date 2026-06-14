# Restaurant Business Mode Implementation Plan

Status: Phase 7F implemented
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
Phase 8A - Order/kitchen/serving/table status API route             Next
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

## Phase 3 result

Restaurant now has a scoped read-only backend route mounted through the API router.

Implemented route file:

- `artifacts/api-server/src/routes/restaurant.ts`

Mounted in:

- `artifacts/api-server/src/routes/index.ts`

Scoped endpoints:

- `GET /restaurant/health`
- `GET /restaurant/dashboard`
- `GET /restaurant/menu-items`
- `GET /restaurant/tables`
- `GET /restaurant/orders/active`
- `GET /restaurant/kitchen`
- `GET /restaurant/serving`
- `GET /restaurant/workflow-preview`

The route enforces restaurant business mode through `requireBusinessContextForUser`. If a user from another business mode hits the route, it returns `businessModeMismatch`. Legacy `/orders`, `/menu`, `/tables`, and F&B dashboard routes stay mounted as compatibility during the migration.

## Phase 4 result

Restaurant now exposes backend-powered shared dashboard summaries through the scoped Restaurant API.

Implemented endpoint:

- `GET /restaurant/shared-dashboard/:dashboardId`

Supported dashboard IDs match the shared dashboard bridge surface used by Retail:

- `overview`
- `sales`
- `customers`
- `inventory`
- `cashflow`
- `financial-reports`
- `invoice-generator`
- `shift-reports`
- `team-management`
- `employee-performance`
- `approvals`
- `audit-controls`
- `roster-overview`
- `employee-attendance`
- `employee-contracts`
- `payroll`

The response is read-only and sourced from Restaurant menu, table, active order, kitchen queue, serving queue, recipe inventory, and completed-order revenue data. Heavy HR dashboards are intentionally returned as skipped/planned surfaces until Restaurant staff/payroll scope becomes active.

## Phase 5 result

Restaurant now has an idempotent demo seed script:

- `artifacts/api-server/scripts/seed-restaurant-demo-data.ts`

Package command:

- `pnpm --filter @workspace/api-server run restaurant:seed`

The seed targets active `RESTAURANT` businesses only. It does not create hidden businesses. Seeded data covers:

- Restaurant profile/tax/service settings.
- Categories.
- Inventory ingredients and packaging.
- Menu items.
- Recipes.
- Dining tables.
- Orders across `PENDING_PAYMENT`, `PAID`, `PREPARING`, `READY`, `SERVED`, and `COMPLETED`.
- Payments.
- Cashflow income entries for paid orders.

The script uses deterministic IDs and conflict-safe updates so it can be rerun without multiplying demo data.

## Phase 6 result

Restaurant frontend read/list workspaces now use the scoped Restaurant API client instead of legacy `/menu`, `/tables`, and `/orders` read endpoints.

Implemented client file:

- `artifacts/pos-system/src/lib/api/restaurant-api.ts`

Updated read/list hooks:

- `src/app/workspace/restaurant/pos/use-pos-menu-catalog.ts`
- `src/app/workspace/restaurant/menu/use-menu-workspace-catalog.ts`
- `src/app/workspace/restaurant/tables/use-tables-workspace-tables.ts`
- `src/app/workspace/restaurant/orders/use-orders-workspace-orders.ts`
- `src/app/workspace/restaurant/kitchen/use-kitchen-orders.ts`
- `src/app/workspace/restaurant/serving/use-serving-orders.ts`

Scoped frontend typecheck:

- `artifacts/pos-system/tsconfig.restaurant.json`
- `pnpm --filter @workspace/pos-system run typecheck:restaurant`

Status mutations still use legacy order/status endpoints until Phase 7E/7F/8A/8B. This keeps compatibility while the Restaurant read surface moves to canonical scoped APIs.

## Phase 7A result

Restaurant now has an explicit Prisma model mapping contract and a schema verifier.

Implemented files:

- `artifacts/api-server/src/services/restaurant/restaurant.prisma-model-map.ts`
- `artifacts/api-server/scripts/verify-restaurant-prisma-schema.mjs`

Package command:

- `pnpm --filter @workspace/api-server run restaurant:schema:verify`

The backend scoped typecheck now runs schema verification before Prisma generate and TypeScript. The mapping is intentionally schema-text based and does not require a database connection.

## Phase 7B result

Restaurant dashboard summary now has an enriched read delegate while preserving the older `totals` and `sales` fields used by existing dashboards.

Implemented surfaces:

- `RestaurantDashboardSummaryDto` now includes `generatedAt`, `window`, `payments`, `operations`, `inventory`, and `health` sections.
- `restaurantPrismaRepository.getDashboardSummary` now computes status breakdowns, payment method totals, queue ages, table occupancy rate, inventory risk, and health signals.
- `artifacts/pos-system/src/lib/api/restaurant-api.ts` mirrors the expanded summary DTO for frontend consumers.

This phase remains read-only. It does not create, update, cancel, refund, or transition orders. Those stay in later workflow phases.

## Phase 7C result

Restaurant now has a canonical workflow read delegate and route.

Implemented surfaces:

- `artifacts/api-server/src/services/restaurant/restaurant.workflow.ts` defines Restaurant workflow stages and allowed transitions.
- `RestaurantWorkflowSummaryDto` exposes workflow stages, stage counts, queue age, operational value, transitions, next actions, and stuck orders.
- `restaurantPrismaRepository.getWorkflowSummary` reads active orders plus completed/cancelled orders created today and maps them into payment, kitchen, serving, completed, and cancelled stages.
- `GET /restaurant/workflow` returns the canonical workflow summary.
- `GET /restaurant/workflow-preview` remains as a compatibility wrapper and now includes the canonical workflow summary.
- `artifacts/pos-system/src/lib/api/restaurant-api.ts` mirrors the workflow summary DTO.

This phase remains read-only. It does not perform workflow transitions yet.

## Phase 7D result

Restaurant now has read-only preview delegates for order creation, payment confirmation, kitchen status movement, and serving status movement.

Implemented surfaces:

- `artifacts/api-server/src/services/restaurant/restaurant.preview.ts` simulates Restaurant workflow operations without writing to the database.
- `POST /restaurant/orders/preview` previews order totals, tax/service charge, table assignment, recipe stock warnings, and whether the order can be submitted.
- `POST /restaurant/payments/preview` previews payment amount due, change, and whether the order can move from `PENDING_PAYMENT` to `PAID`.
- `POST /restaurant/kitchen/preview` previews kitchen transitions such as `PAID -> PREPARING` and `PREPARING -> READY`.
- `POST /restaurant/serving/preview` previews serving transitions such as `READY -> SERVED` and `SERVED -> COMPLETED`.
- `artifacts/pos-system/src/lib/api/restaurant-api.ts` mirrors the preview DTOs and exposes typed preview client helpers.

This phase does not create orders, confirm payments, update kitchen status, update serving status, cancel orders, refund payments, or mutate stock. It is a safety preview layer before Phase 7E/7F write delegates.

## Phase 7E result

Restaurant now has scoped write delegates for order creation and payment confirmation.

Implemented surfaces:

- `artifacts/api-server/src/services/restaurant/restaurant.order-write.ts` performs transactional Restaurant order creation and payment confirmation.
- `POST /restaurant/orders` creates an order through the scoped Restaurant API.
- `POST /restaurant/payments/confirm` confirms payment for a `PENDING_PAYMENT` order.
- Paid writes deduct recipe inventory, create `StockMovement` records, post `CashflowEntry` income, update table occupancy, update shift expected cash for cash payments, and create normalized `AuditLog` entries.
- `artifacts/pos-system/src/lib/api/restaurant-api.ts` exposes typed `createOrder` and `confirmPayment` helpers.

This phase does not update kitchen/serving workflow status, cancel orders, refund payments, or reverse stock/cashflow. Those remain in Phase 7F and Phase 8C/8D.

## Phase 7F result

Restaurant now has guarded scoped write delegates for kitchen and serving workflow status movement.

Implemented surfaces:

- `artifacts/api-server/src/services/restaurant/restaurant.status-write.ts` performs guarded transactional status updates.
- `POST /restaurant/kitchen/status` writes kitchen transitions with `RESTAURANT_KITCHEN_ROLES`.
- `POST /restaurant/serving/status` writes serving transitions with `RESTAURANT_SERVING_ROLES`.
- `artifacts/pos-system/src/lib/api/restaurant-api.ts` exposes typed `updateKitchenStatus` and `updateServingStatus` helpers.

Allowed write transitions in this phase:

- `PAID -> PREPARING`
- `PREPARING -> READY`
- `READY -> SERVED`
- `SERVED -> COMPLETED`

When `SERVED -> COMPLETED` succeeds for a dine-in order, the assigned table is moved to `CLEANING`. Every status write creates a normalized `AuditLog` entry. Payment confirmation stays in `POST /restaurant/payments/confirm`; cancellation stays planned for the reversal workflow because it needs stock/cashflow handling.
