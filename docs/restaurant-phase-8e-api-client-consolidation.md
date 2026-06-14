# Phase 8E - Generated API client consolidation

Status: Implemented
Scope: Restaurant frontend API client surface only

## Goal

Phase 8E consolidates the Restaurant frontend API contract into one canonical facade so new Restaurant workspace code imports a single client instead of reaching into multiple helper modules.

This phase does not claim that the client is generated from OpenAPI yet. It creates the generated-client-ready contract boundary that a future generator can replace without forcing every workspace file to change imports again.

## Canonical frontend import

New Restaurant workspace code should prefer:

```ts
import { restaurantClient } from "@/lib/api";
```

instead of importing `restaurantApi` or `restaurantPaymentReversalApi` directly.

## Implemented client facade

File:

```text
artifacts/pos-system/src/lib/api/restaurant-client.ts
```

Exports:

- `restaurantClient`
- `RESTAURANT_API_CONTRACT_VERSION`
- `RESTAURANT_API_ENDPOINTS`
- `RestaurantClient`
- `RestaurantApiEndpointKey`
- `RestaurantApiEndpointPath`

The facade combines:

- read endpoints
- POS order preview/create
- payment confirm
- payment refund/void reversal
- order status preview/update
- cancellation preview/write
- kitchen queue/actions
- serving queue/actions
- workflow reads

## Endpoint manifest

`RESTAURANT_API_ENDPOINTS` is a typed manifest for the canonical Restaurant client surface.

It exists to make future OpenAPI or generated-client work easier. The frontend now has one place to compare expected Restaurant endpoint paths.

## Compatibility

Existing exports remain available:

- `restaurantApi`
- `restaurantPaymentReversalApi`

They are not removed in this phase because older Restaurant code and docs may still reference them.

New workspace code should use `restaurantClient`.

## Workspace migration

Restaurant workspace read/action hooks were moved to `restaurantClient`:

- POS menu catalog
- Menu workspace catalog
- Tables workspace
- Orders workspace
- Kitchen workspace
- Serving workspace

## Out of scope

This phase does not:

- generate OpenAPI types
- remove legacy `orderApi`, `menuApi`, `paymentsApi`, or `tablesApi`
- delete F&B compatibility code
- wire payment reversal or cancellation buttons into UI
- add CI automation

Those stay in later phases.

## Validation

```bash
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Optional full Restaurant gate:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```
