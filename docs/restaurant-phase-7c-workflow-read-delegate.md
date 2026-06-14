# Restaurant Phase 7C - Workflow Read Delegate

Status: Done
Scope: Restaurant business mode only

## Goal

Create one canonical read model for Restaurant order workflow state. Before this phase, the API exposed separate active order, kitchen, serving, and workflow preview reads. That worked, but it forced consumers to understand workflow rules by stitching several endpoints together.

Phase 7C adds a single workflow summary delegate and endpoint.

## Implemented files

- `artifacts/api-server/src/services/restaurant/restaurant.workflow.ts`
- `artifacts/api-server/src/services/restaurant/restaurant.types.ts`
- `artifacts/api-server/src/services/restaurant/restaurant.repository.ts`
- `artifacts/api-server/src/services/restaurant/restaurant.prisma-repository.ts`
- `artifacts/api-server/src/services/restaurant/restaurant.service.ts`
- `artifacts/api-server/src/routes/restaurant.ts`
- `artifacts/pos-system/src/lib/api/restaurant-api.ts`

## Canonical endpoint

```text
GET /restaurant/workflow
```

Runtime API path is normally:

```text
GET /api/restaurant/workflow
```

## Compatibility endpoint

```text
GET /restaurant/workflow-preview
```

The preview endpoint remains available for older consumers. It now returns:

- `workflow`: canonical workflow summary.
- `activeOrders`: flattened active payment/kitchen/serving orders.
- `kitchenQueue`: kitchen stage orders.
- `servingQueue`: serving stage orders filtered to `READY` for compatibility.

## Workflow stages

The canonical stages are:

- `payment`: `PENDING_PAYMENT`
- `kitchen`: `PAID`, `PREPARING`
- `serving`: `READY`, `SERVED`
- `completed`: `COMPLETED` orders created today
- `cancelled`: `CANCELLED` orders created today

## Response shape

The canonical summary includes:

- `generatedAt`
- `totals`
- `stages`
- `transitions`
- `nextActions`
- `stuckOrders`

Each stage includes count, total value, oldest order age, health status, and mapped orders.

## Allowed transitions

Restaurant now has scoped transition metadata under `restaurant.workflow.ts`:

```text
PENDING_PAYMENT -> PAID, CANCELLED
PAID            -> PREPARING, CANCELLED
PREPARING      -> READY, CANCELLED
READY           -> SERVED, CANCELLED
SERVED          -> COMPLETED
COMPLETED       -> none
CANCELLED       -> none
```

These are read metadata only. Actual guarded mutation stays for Phase 7F / Phase 8A / Phase 8B.

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

## Out of scope

This phase does not:

- update order status
- create orders
- cancel orders
- process refunds
- deduct or restore stock
- replace legacy order mutation endpoints
