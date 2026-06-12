# Backend Structure

This document is the current source of truth for the backend folder structure.

The backend is still a modular monolith. The active product mode is Restaurant / F&B. The structure should stay readable without pretending the project already has mature Retail, Service, or Livestock modules.

## Current Target Tree

```txt
artifacts/api-server/src/
├── app.ts
├── index.ts
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── logger.ts
│   ├── business-context/
│   ├── errors/
│   └── responses/
├── routes/
│   ├── index.ts
│   ├── health.ts
│   ├── auth.ts
│   ├── menu.ts
│   ├── orders-status.ts
│   ├── orders.ts
│   ├── tables.ts
│   ├── inventory.ts
│   ├── shifts.ts
│   ├── payments.ts
│   ├── invoices.ts
│   ├── misc-business.ts
│   ├── misc.ts
│   ├── events.ts
│   └── upload.ts
├── services/
│   ├── permissions/
│   ├── realtime/
│   └── orders/
├── middleware/
├── utils/
└── prisma/
```

## Why This Structure

### `lib/`

`lib/` contains backend infrastructure and cross-cutting primitives:

- authentication helpers
- Prisma client wiring
- logger setup
- business context / tenant bridge
- shared error objects
- shared response helpers

Files in `lib/` should not contain feature-specific workflows such as order creation, stock deduction, payment settlement, or menu recipe orchestration.

### `routes/`

`routes/` contains Express routers only.

Route files should stay thin:

1. Read request data.
2. Get authenticated user.
3. Resolve business context.
4. Validate simple input shape.
5. Call a service.
6. Return success/error response.

Route files should not own heavy business logic, long transactions, stock rules, payment rules, or order workflow rules.

### `routes/orders-status.ts`

`orders-status.ts` intentionally exists as a focused override for:

```txt
PATCH /orders/:id/status
```

It is mounted before `orders.ts`, so the new status workflow route is active before the legacy order router.

Do not delete this file just because `orders.ts` also still exists.

### `routes/orders.ts`

`orders.ts` is currently legacy-heavy and still owns several workflows:

- order listing
- order detail
- order creation
- table move
- legacy status route block that should be removed later

The next safe cleanup is to extract create-order logic into a service instead of moving the whole file at once.

### `routes/misc-business.ts`

`misc-business.ts` contains business-scoped replacements for some legacy misc endpoints.

It is mounted before `misc.ts` so migrated endpoints are handled first while legacy settings endpoints remain stable.

Do not delete it until `misc.ts` is fully replaced.

### `routes/misc.ts`

`misc.ts` is legacy and still handles settings-related endpoints.

It should be migrated gradually because it touches payment settings fields. Avoid broad rewrites unless the route is fully covered by typecheck/build and manual smoke testing.

### `services/`

`services/` contains business logic.

Current active service folders:

- `services/permissions/`
- `services/realtime/`
- `services/orders/`

`services/orders/` is allowed for now because it contains real active workflow code. Do not move it to `services/restaurant/orders/` just for aesthetics.

A future restaurant-specific split may look like this only after more workflow services exist:

```txt
services/restaurant/
├── orders/
├── menu/
└── inventory/
```

Do not create empty `restaurant/` or `retail/` service folders just to satisfy a planned tree. Empty folders are not structure. They are decorative clutter with better marketing.

## Route Mount Order

`routes/index.ts` must preserve this important order:

```ts
router.use(ordersStatusRouter);
router.use(ordersRouter);

router.use(miscBusinessRouter);
router.use(miscRouter);
```

Reason:

- `orders-status.ts` must override legacy status handling in `orders.ts`.
- `misc-business.ts` must handle migrated misc endpoints before `misc.ts`.

Changing this order can silently reactivate legacy behavior.

## Business Context Rule

During the Business tenant bridge phase:

- `businessContext.businessId` means the new generic `Business.id`.
- `businessContext.restaurantId` means the legacy `Restaurant.id`.

Legacy tables still use `restaurantId`, so legacy table writes must use:

```ts
businessContext.restaurantId
```

Not:

```ts
businessContext.businessId
```

Use `businessId` for generic tenant concepts and realtime business channels. Use `restaurantId` for current Prisma models that still store `restaurantId`.

## Cleanup Rules

A file may be split when at least one of these is true:

- the route contains a transaction longer than a small CRUD operation
- the route mutates stock, payments, order status, shift cash, table state, or audit logs
- the route has reusable business rules
- the route handles permission-sensitive workflow decisions
- the route is hard to test manually because too many concerns are mixed

A file should not be split when the only reason is:

- the folder tree looks nicer
- the file name annoys someone
- the project wants to look enterprise
- there is no actual service boundary yet

## Next Structure Cleanup Plan

1. Keep current route order stable.
2. Remove the legacy `PATCH /orders/:id/status` block from `routes/orders.ts` after typecheck/build is green.
3. Extract create-order workflow from `routes/orders.ts` into `services/orders/create-order.service.ts` or `services/restaurant/orders/create-order.service.ts`.
4. Make inventory dashboard API-backed before adding more dashboards.
5. Wire menu creation to recipe setup instead of leaving recipe mapping hidden in a separate workflow.
6. Only introduce `services/restaurant/` once at least two restaurant workflows are extracted.
7. Only introduce `routes/retail/` and `services/retail/` when real retail endpoints exist.

## Smoke Test Checklist

After structure changes, run:

```powershell
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
```

Then manually check:

```txt
GET /api/health
login/register
GET /api/menu-items
GET /api/inventory-items
GET /api/recipes
POST /api/orders
PATCH /api/orders/:id/status
GET /api/events
```

If order status update fails, first check route mount order before changing business logic.
