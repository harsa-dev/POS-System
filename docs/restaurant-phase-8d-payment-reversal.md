# Restaurant Phase 8D - Payment Refund/Void Reversal Workflow

## Status

Implemented.

## Scope

Phase 8D adds a standalone Restaurant payment reversal workflow. This is separate from order cancellation because a payment can be corrected without cancelling the operational order.

## Backend services

Implemented service:

- `artifacts/api-server/src/services/restaurant/restaurant.payment-reversal.ts`

The service supports two reversal actions:

- `void` for `PENDING` payments.
- `refund` for `PAID` payments.

## Backend routes

Implemented routes:

```text
POST /restaurant/orders/:orderId/payment-reversal/preview
POST /restaurant/orders/:orderId/payment-reversal
```

Runtime path with the API prefix:

```text
POST /api/restaurant/orders/:orderId/payment-reversal/preview
POST /api/restaurant/orders/:orderId/payment-reversal
```

## Preview behavior

The preview endpoint returns whether the reversal is allowed, the inferred or requested action, amount, payment status, and warnings.

It blocks:

- Missing order.
- Missing payment record.
- `void` on non-`PENDING` payment.
- `refund` on non-`PAID` payment.
- Refund amount less than or equal to zero.
- Refund amount greater than order total.
- Duplicate refund cashflow entries.
- Cancelled order refund attempts, because cancellation owns stock, table, cashflow, and audit alignment.

## Write behavior

The write endpoint re-checks the current payment status inside a transaction.

For `void`:

- Updates payment status from `PENDING` to `EXPIRED`.
- Does not post cashflow.
- Keeps order status unchanged.
- Writes audit log event `restaurant.payment.voided`.

For `refund`:

- Keeps payment status as `PAID` because the Prisma enum does not include `REFUNDED`.
- Posts a cashflow `EXPENSE` with `sourceType: REFUND`.
- Blocks duplicate refund cashflow for the same order.
- Decrements current open shift expected cash for cash refunds when an open shift exists.
- Keeps order status unchanged.
- Writes audit log event `restaurant.payment.refunded`.

## Frontend API client

Implemented client:

- `artifacts/pos-system/src/lib/api/restaurant-payment-reversal-api.ts`

Exported helpers:

```ts
restaurantPaymentReversalApi.previewPaymentReversal(orderId, input)
restaurantPaymentReversalApi.reversePayment(orderId, input)
```

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Manual smoke:

```text
POST /api/restaurant/orders/:orderId/payment-reversal/preview
POST /api/restaurant/orders/:orderId/payment-reversal
GET  /api/restaurant/dashboard
GET  /api/restaurant/workflow
```

## Out of scope

- UI buttons for refund/void.
- Partial refund UI.
- Multi-refund ledger support.
- Payment provider webhook reconciliation.
- Re-opening cancelled orders.
