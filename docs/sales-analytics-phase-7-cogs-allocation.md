# Sales Analytics Phase 7: COGS Allocation Accuracy

## Status

Phase 7 improves Sales Analytics COGS accuracy without adding a database migration.

This phase keeps the current source of truth:

- `Order`
- `OrderItem`
- `StockMovement`
- `StockMovement.reason = RECIPE_USAGE`
- `StockMovement.unitCostSnapshot`
- `StockMovement.sourceId`

The goal is to stop showing fake zero COGS for scoped filters while staying honest about the fact that exact item-level cost snapshots do not exist yet.

## Problem Before Phase 7

Before this phase, scoped filters such as product, category, payment method, status, or search caused Sales Analytics to hide COGS by forcing it to `0`.

That avoided misleading exact COGS, but it created a different problem:

- product-filtered reports showed zero COGS,
- gross profit looked overstated,
- margin looked too optimistic,
- analytics became less useful for operational review.

That was safe but not good enough.

## What Changed

### Backend

COGS summary now uses allocated order-level stock movement COGS.

The backend reads order-level recipe usage COGS from `StockMovement`, then allocates that cost to matching `OrderItem` rows using revenue share:

```txt
allocatedItemCogs = orderLevelCogs * (orderItem.subtotal / order.subtotal)
```

The same allocation model is used for:

- summary COGS,
- row COGS,
- gross profit sorting,
- margin sorting,
- product filters,
- category filters,
- payment method filters,
- order status filters,
- search filters.

### Source Health

`sourceHealth` now includes:

```ts
stockMovementsWithoutOrderSource: number;
```

This tells the dashboard whether some recipe usage stock movements cannot be allocated because they are not linked to an order through `sourceId`.

### Warnings

Backend warnings now clearly state:

- COGS is allocated from order-level stock movement snapshots.
- Scoped filters use estimated allocation.
- Missing cost snapshots can understate COGS.
- Stock movements without order source can understate allocated COGS.

Frontend does not create these warnings.

## Why This Is Safe

This phase follows the project rules:

- frontend does not calculate final COGS,
- backend owns analytics calculations,
- database remains source of truth,
- historical reports use stored snapshots, not current inventory cost,
- restaurant scope is enforced in repository queries,
- scoped filters do not pretend exact item-level cost exists.

## Current Formula

Order-level COGS:

```txt
SUM(ABS(stockMovement.quantity) * stockMovement.unitCostSnapshot)
```

Conditions:

```txt
stockMovement.restaurantId = current restaurant
stockMovement.reason = RECIPE_USAGE
stockMovement.sourceId IS NOT NULL
stockMovement.unitCostSnapshot IS NOT NULL
```

Allocated item COGS:

```txt
orderLevelCogs * (orderItem.subtotal / order.subtotal)
```

Gross profit:

```txt
orderItem.totalRevenue - allocatedItemCogs
```

Margin:

```txt
grossProfit / orderItem.totalRevenue * 100
```

## Known Limitations

This is still an allocation model.

It is better than zero COGS for filtered reports, but it is not the final perfect accounting model.

Limitations:

- `OrderItem` does not store item-level cost snapshot yet.
- `StockMovement` is linked to orders, not individual order items.
- If an order contains multiple products with different recipe costs, revenue-share allocation is approximate.
- If `StockMovement.sourceId` is missing, that cost cannot be allocated.
- If `unitCostSnapshot` is missing, COGS may be understated.

## Deferred Work

Future stronger model:

- add item-level cost snapshot to `OrderItem`,
- store recipe cost snapshot at order time,
- optionally link `StockMovement` to `OrderItem`,
- add automated integration tests for COGS allocation,
- add reconciliation detail for unlinked stock movements,
- add report notes that distinguish exact vs estimated COGS.

## Manual Test Checklist

### API

```txt
GET /api/sales-analytics
GET /api/sales-analytics?productId=<id>
GET /api/sales-analytics?categoryId=<id>
GET /api/sales-analytics?q=<keyword>
GET /api/sales-analytics?sortBy=grossProfit&sortDirection=desc
GET /api/sales-analytics?sortBy=margin&sortDirection=asc
```

Expected:

- COGS is not forced to zero for scoped filters.
- Gross profit and margin use allocated COGS.
- Source health includes `stockMovementsWithoutOrderSource`.
- Warnings mention allocated COGS when COGS exists.
- Warnings mention scoped allocation when product/category/search/payment/status filter is active.

### Dashboard

1. Open Sales Analytics.
2. Compare unfiltered COGS with filtered COGS.
3. Filter by product.
4. Filter by category.
5. Search product name.
6. Sort by gross profit.
7. Sort by margin.
8. Confirm Source Health warnings are visible.
9. Confirm frontend does not invent its own COGS messages.

## Anti-patterns Avoided

- No frontend COGS calculation.
- No current inventory cost used for old orders.
- No fake zero COGS for product/category filters.
- No cross-restaurant COGS query.
- No schema migration just to fake precision.
- No pretending allocated COGS is exact item-level cost.
