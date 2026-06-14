# Restaurant Phase 7F - Guarded workflow status delegate

Status: Done
Scope: Restaurant business mode only

## Goal

Add scoped Restaurant write delegates for kitchen and serving workflow status movement.

This phase moves status writes away from legacy F&B/order status surfaces for the supported operational path while keeping cancellation and refund/reversal workflows out of scope.

## Implemented surfaces

Backend:

- `artifacts/api-server/src/services/restaurant/restaurant.status-write.ts`
- `POST /restaurant/kitchen/status`
- `POST /restaurant/serving/status`

Frontend API client:

- `restaurantApi.updateKitchenStatus(input)`
- `restaurantApi.updateServingStatus(input)`
- `RestaurantStatusActionWriteDto`

## Allowed transitions

The status write delegate allows only non-reversal operational transitions:

- `PAID -> PREPARING`
- `PREPARING -> READY`
- `READY -> SERVED`
- `SERVED -> COMPLETED`

Payment confirmation remains owned by:

- `POST /restaurant/payments/confirm`

Cancellation remains planned for a later reversal workflow because it must handle stock/cashflow reversal.

## Guard behavior

The delegate uses the preview layer first. A status write only proceeds when the matching preview is allowed.

The delegate then re-reads the order inside a transaction and verifies the status did not change between preview and write.

If the order changed, the write returns a conflict instead of overwriting newer state.

## Side effects

Successful status writes:

- update the scoped Restaurant order status
- write a normalized `AuditLog` payload
- move a dine-in table to `CLEANING` when `SERVED -> COMPLETED` succeeds

This phase does not create stock movements, cashflow reversals, refunds, or cancellation records.

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Manual endpoint checks after seed/server:

```text
POST /api/restaurant/kitchen/status
POST /api/restaurant/serving/status
GET  /api/restaurant/workflow
GET  /api/restaurant/dashboard
```

## Out of scope

- Frontend button wiring for status actions.
- Generic order status route cleanup.
- Order cancellation reversal.
- Payment refund/void reversal.
- Generated OpenAPI/client consolidation.
- Root Restaurant smoke test and scoped CI gate.
