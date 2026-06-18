---
name: StockMovement cost snapshot fields
description: Architecture for unitCostSnapshot/totalCostSnapshot/previousStock/newStock on StockMovement; COGS SQL pattern; repair classification.
---

## Rule
`StockMovement.unitCostSnapshot` is the source of truth for historical COGS. Always prefer it over `InventoryItem.costPerUnit` (mutable current cost).

COGS SQL pattern:
```sql
COALESCE(sm."unitCostSnapshot", ii."costPerUnit"::numeric)
```

**Why:** `costPerUnit` changes when item prices are updated; using it for historical COGS gives wrong numbers. `unitCostSnapshot` is frozen at movement creation time.

## How to apply
- Any SQL computing COGS from StockMovement must use the COALESCE pattern.
- A "missing cost snapshot" = `sm.unitCostSnapshot IS NULL` — NOT `ii.costPerUnit <= 0`.
- REPAIRABLE = `unitCostSnapshot IS NULL AND ii.costPerUnit > 0` (backfill can write current cost as proxy).
- NEEDS_ITEM_COST = `unitCostSnapshot IS NULL AND ii.costPerUnit <= 0` (user must set cost first).
- `previousStock` and `newStock` are stock levels before/after the movement, stored as Float? on the movement row.

## Fields added in Phase 6C-R (migration 20260618000000_add_stock_movement_cost_snapshots)
- `previousStock Float?`
- `newStock Float?`
- `unitCostSnapshot Decimal?` — with @@index
- `totalCostSnapshot Decimal?` — ABS(quantity) * unitCostSnapshot, stored for efficiency

## Files that must follow this pattern
- `routes/inventory-cost-snapshot-repairs.ts` — backfill endpoint
- `routes/inventory-movement-reports.ts` — movement value calculation
- `routes/inventory-movement-anomalies.ts` — isMissingCostSnapshot check
- `services/sales-analytics/repository.ts` — orderCogsCte, getCogsByOrderIds, getSalesSourceHealth
- `services/financial-reports/reconciliation.ts` — countMissingCostSnapshots, listMissingCostSnapshots
