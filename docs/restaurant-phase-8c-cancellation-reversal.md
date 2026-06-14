# Restaurant Phase 8C - Order Cancellation + Stock/Cashflow Reversal

Status: Implemented
Scope: Restaurant business mode only

## Goal

Provide a scoped Restaurant cancellation workflow that does more than changing an order status to `CANCELLED`.

Cancellation is a reversal workflow. It must handle stock, cashflow, table state, payment state, and audit history consistently.

## Backend surfaces

Implemented service:

- `artifacts/api-server/src/services/restaurant/restaurant.cancellation.ts`

Implemented routes:

- `POST /restaurant/orders/:orderId/cancellation/preview`
- `POST /restaurant/orders/:orderId/cancel`

The preview route uses read roles. The write route uses `RESTAURANT_CANCELLATION_ROLES`.

## Cancellable statuses

The cancellation workflow accepts:

- `PENDING_PAYMENT`
- `PAID`
- `PREPARING`
- `READY`
- `SERVED`

It rejects terminal statuses:

- `COMPLETED`
- `CANCELLED`

## Preview behavior

The preview response reports:

- whether the order can be cancelled
- whether stock will be restored
- whether cashflow will be reversed
- whether the table will be released to cleaning
- warnings for missing reason, stock reversal, cashflow reversal, and table release

## Write behavior

When cancellation is written:

1. The service re-reads the order inside a transaction.
2. It rejects stale writes if the order status changed after preview.
3. If `inventoryDeducted` is true, recipe stock is restored.
4. Stock restoration creates `StockMovement` rows with:
   - `type: IN`
   - `reason: RETURN`
   - `source: ORDER`
   - `sourceType: ORDER`
5. If the order has paid value, a `CashflowEntry` reversal is posted with:
   - `type: EXPENSE`
   - `sourceType: REFUND`
6. If the order has a linked dine-in table, that table moves to `CLEANING`.
7. Pending payments are marked `EXPIRED`.
8. The order is marked `CANCELLED`, with `cancelReason` and `cancelledAt`.
9. `inventoryDeducted` is set to false after stock restoration to prevent double-restore behavior.
10. A normalized `AuditLog` entry is created.

## Frontend API client

Implemented helpers:

- `restaurantApi.previewCancellation(orderId, { reason })`
- `restaurantApi.cancelOrder(orderId, { reason })`

The UI wiring for a cancellation button/modal can use preview first, then execute the write after confirmation.

## Out of scope

This phase does not implement a standalone payment refund/void module. Payment-specific refund semantics remain planned for Phase 8D.

This phase does not delete legacy F&B endpoints.

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Smoke manually:

```text
POST /api/restaurant/orders/:orderId/cancellation/preview
POST /api/restaurant/orders/:orderId/cancel
GET  /api/restaurant/workflow
GET  /api/restaurant/tables
GET  /api/restaurant/dashboard
```
