# Phase 8A - Order/Kitchen/Serving/Table Status API Route

Status: Implemented

## Goal

Phase 8A consolidates Restaurant workflow status movement into a canonical order status route.

Before this phase, Restaurant had surface-specific compatibility endpoints:

- `POST /restaurant/kitchen/status`
- `POST /restaurant/serving/status`

Those endpoints still exist for compatibility, but the canonical route for new frontend work is now:

- `POST /restaurant/orders/:orderId/status/preview`
- `POST /restaurant/orders/:orderId/status`

The canonical route keeps the order identifier in the URL and uses `targetStatus` in the body.

## Backend implementation

Implemented in:

- `artifacts/api-server/src/routes/restaurant.ts`

The route infers the operational surface from `targetStatus`:

- `PREPARING` and `READY` map to the kitchen surface.
- `SERVED` and `COMPLETED` map to the serving surface.

This means the UI does not need to decide which backend surface route to call. It only needs to send the target status for the order.

## Endpoints

Preview:

```http
POST /restaurant/orders/:orderId/status/preview
Content-Type: application/json

{
  "targetStatus": "PREPARING"
}
```

Write:

```http
POST /restaurant/orders/:orderId/status
Content-Type: application/json

{
  "targetStatus": "PREPARING"
}
```

## Supported targets

The canonical route accepts only kitchen and serving workflow targets:

- `PREPARING`
- `READY`
- `SERVED`
- `COMPLETED`

Payment confirmation remains separate:

- `POST /restaurant/payments/confirm`

Cancellation remains separate and planned for the reversal workflow because cancellation must handle stock and cashflow reversal:

- Phase 8C - Order cancellation + stock/cashflow reversal workflow

## Frontend implementation

Implemented in:

- `artifacts/pos-system/src/lib/api/restaurant-api.ts`

New helpers:

```ts
restaurantApi.previewOrderStatus(orderId, { targetStatus });
restaurantApi.updateOrderStatus(orderId, { targetStatus });
```

The old helpers remain temporarily for compatibility:

```ts
restaurantApi.updateKitchenStatus(input);
restaurantApi.updateServingStatus(input);
```

Phase 8B should migrate UI action buttons to the canonical `updateOrderStatus` helper.

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Manual smoke after seed:

```http
POST /api/restaurant/orders/:orderId/status/preview
POST /api/restaurant/orders/:orderId/status
GET  /api/restaurant/workflow
GET  /api/restaurant/tables
```

## Out of scope

This phase does not:

- Wire UI buttons to the canonical route.
- Delete kitchen/serving compatibility endpoints.
- Implement cancellation or reversal.
- Implement payment refund/void.
- Delete legacy F&B routes.
