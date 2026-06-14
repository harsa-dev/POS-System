# Restaurant Phase 7E - Order/Write Delegate

Status: Done

## Goal

Add scoped Restaurant write delegates for order creation and payment confirmation without rewriting the legacy F&B routes yet.

## Implemented surfaces

- `artifacts/api-server/src/services/restaurant/restaurant.order-write.ts`
- `POST /restaurant/orders`
- `POST /restaurant/payments/confirm`
- `artifacts/pos-system/src/lib/api/restaurant-api.ts`

## Order creation

`POST /restaurant/orders` uses the same body shape as the order preview endpoint.

```json
{
  "type": "DINE_IN",
  "tableId": "table-id",
  "paymentMethod": "CASH",
  "amountPaid": 150000,
  "items": [
    { "menuItemId": "menu-item-id", "quantity": 2 }
  ]
}
```

The write delegate first runs the preview service as a safety gate. If the preview is blocked, the write is rejected and returns preview warnings.

When the order is created:

- Cash orders become `PAID` immediately.
- Non-cash orders remain `PENDING_PAYMENT` until confirmed.
- Dine-in tables move to `OCCUPIED`.
- Paid orders deduct recipe inventory where recipe lines exist.
- Paid orders create `StockMovement` rows with `source = ORDER` and `reason = RECIPE_USAGE`.
- Paid orders create/update a `CashflowEntry` with `sourceType = ORDER_PAYMENT`.
- Cash payments increment the current open shift expected cash when an open shift exists.
- A normalized `AuditLog` entry is written.

## Payment confirmation

`POST /restaurant/payments/confirm` uses this body:

```json
{
  "orderId": "order-id",
  "paymentMethod": "QRIS",
  "amountPaid": 150000
}
```

The payment confirmation delegate:

- Requires the order to be in `PENDING_PAYMENT`.
- Requires `amountPaid >= order.total`.
- Updates the order to `PAID`.
- Upserts the order `Payment` record as `PAID`.
- Deducts recipe inventory if the order was not already deducted.
- Posts `CashflowEntry` income.
- Writes normalized audit metadata.

## Error behavior

Write errors are returned as API errors:

- `400 VALIDATION_ERROR` for invalid payload or stock/table/order validation failures.
- `404 NOT_FOUND` when a scoped Restaurant order is missing.
- `409 CONFLICT` when preview state or order state blocks the write.

## Compatibility notes

Legacy `/orders` routes remain mounted. Phase 7E adds scoped Restaurant write routes but does not delete or rewrite the old route surface yet.

## Out of scope

- Kitchen status mutation.
- Serving status mutation.
- Order cancellation.
- Payment refund or void.
- Stock/cashflow reversal.
- Frontend action wiring into UI buttons.

Those are covered by Phase 7F and Phase 8C/8D.

## Validation

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```
