# Phase 8B - Status Frontend Action

## Status

Implemented.

## Scope

This phase moves Restaurant workspace status action buttons from legacy order status helpers to the canonical Restaurant order status API introduced in Phase 8A.

Canonical frontend action path:

- `restaurantApi.updateOrderStatus(orderId, { targetStatus })`

Canonical backend endpoint:

- `POST /restaurant/orders/:orderId/status`

## Updated frontend workspaces

- `artifacts/pos-system/src/app/workspace/restaurant/restaurant-kitchen-workspace.tsx`
- `artifacts/pos-system/src/app/workspace/restaurant/restaurant-serving-workspace.tsx`
- `artifacts/pos-system/src/app/workspace/restaurant/restaurant-orders-workspace.tsx`

## Behavior

Kitchen actions now call the canonical order status API:

- `PAID -> PREPARING`
- `PREPARING -> READY`

Serving actions now call the canonical order status API:

- `READY -> SERVED`

Orders workspace completion now calls the canonical order status API:

- `SERVED -> COMPLETED`

The workspaces keep duplicate-submit guards, per-order loading state, toast feedback, and queue reloads after successful mutation.

## Compatibility

The old compatibility helpers remain available in `restaurantApi`:

- `updateKitchenStatus`
- `updateServingStatus`

However, Restaurant workspace buttons no longer depend on the legacy `orderApi.updateStatusWithResult` helper.

## Out of scope

This phase does not add cancellation, refund, void, rollback, or stock/cashflow reversal UI. Those stay in Phase 8C and Phase 8D.

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Manual smoke:

1. Seed Restaurant demo data.
2. Open Restaurant Kitchen workspace.
3. Move a `PAID` order to `PREPARING`.
4. Move a `PREPARING` order to `READY`.
5. Open Restaurant Serving workspace.
6. Move a `READY` order to `SERVED`.
7. Open Restaurant Orders workspace.
8. Complete a `SERVED` order.
9. Confirm the table moves to `CLEANING` for dine-in orders.
