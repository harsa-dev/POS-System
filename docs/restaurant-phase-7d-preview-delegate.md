# Restaurant Phase 7D - Order/Payment/Kitchen/Serving Preview Delegate

Status: Implemented
Scope: Restaurant business mode only

## Goal

Phase 7D adds read-only preview delegates before Restaurant write workflows are implemented.

The preview layer answers this question:

> If this action is attempted, what totals, stock warnings, status movement, and blocking reasons should the user see before anything is written?

This prevents frontend actions from calling mutation endpoints blindly.

## Implemented files

- `artifacts/api-server/src/services/restaurant/restaurant.types.ts`
- `artifacts/api-server/src/services/restaurant/restaurant.preview.ts`
- `artifacts/api-server/src/routes/restaurant.ts`
- `artifacts/pos-system/src/lib/api/restaurant-api.ts`

## Backend endpoints

```text
POST /restaurant/orders/preview
POST /restaurant/payments/preview
POST /restaurant/kitchen/preview
POST /restaurant/serving/preview
```

At runtime these normally sit under `/api`:

```text
POST /api/restaurant/orders/preview
POST /api/restaurant/payments/preview
POST /api/restaurant/kitchen/preview
POST /api/restaurant/serving/preview
```

All endpoints use the Restaurant business-mode guard and return `businessModeMismatch` when called from another mode.

## Order preview

`POST /restaurant/orders/preview` accepts an order draft:

```json
{
  "type": "DINE_IN",
  "tableId": "table-id",
  "paymentMethod": "CASH",
  "amountPaid": 100000,
  "items": [
    { "menuItemId": "menu-item-id", "quantity": 2 }
  ]
}
```

It returns:

- Preview item rows.
- Subtotal.
- Tax amount.
- Service amount.
- Total.
- Change amount.
- Table warning.
- Recipe stock warning.
- `canSubmit`.

It does not create an order.

## Payment preview

`POST /restaurant/payments/preview` accepts:

```json
{
  "orderId": "order-id",
  "paymentMethod": "CASH",
  "amountPaid": 100000
}
```

It returns:

- Current order status.
- Amount due.
- Change amount.
- Whether payment can be confirmed.
- Next status preview, normally `PAID`.

It does not create or update a `Payment`.

## Kitchen preview

`POST /restaurant/kitchen/preview` accepts:

```json
{
  "orderId": "order-id",
  "targetStatus": "PREPARING"
}
```

Supported kitchen transitions:

```text
PAID -> PREPARING
PREPARING -> READY
```

If `targetStatus` is omitted, the service infers the next kitchen target from the current order status.

It does not update order status.

## Serving preview

`POST /restaurant/serving/preview` accepts:

```json
{
  "orderId": "order-id",
  "targetStatus": "SERVED"
}
```

Supported serving transitions:

```text
READY -> SERVED
SERVED -> COMPLETED
```

If `targetStatus` is omitted, the service infers the next serving target from the current order status.

It does not update order status.

## Frontend client

`artifacts/pos-system/src/lib/api/restaurant-api.ts` now exposes:

```ts
restaurantApi.previewOrder(input)
restaurantApi.previewPayment(input)
restaurantApi.previewKitchenAction(input)
restaurantApi.previewServingAction(input)
```

These helpers are typed but not yet wired into UI actions. Frontend action wiring belongs to later phases.

## Out of scope

This phase does not:

- Create orders.
- Confirm payments.
- Update kitchen status.
- Update serving status.
- Cancel orders.
- Refund payments.
- Deduct or restore stock.
- Create audit logs.
- Create cashflow entries.

Those belong to Phase 7E, Phase 7F, and Phase 8 workflows.

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Manual smoke after server + seed:

```text
POST /api/restaurant/orders/preview
POST /api/restaurant/payments/preview
POST /api/restaurant/kitchen/preview
POST /api/restaurant/serving/preview
```
