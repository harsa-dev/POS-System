# Phase 6C-R: Schema Recovery — Cost Snapshot Fields

**Status:** Applied  
**Date:** 2026-06-18  
**Supersedes:** `v3-phase-6c-prisma-schema-integrity.md`

---

## Problem

Phase 6C introduced several correct fixes (businessId scoping, unsafe cast removal) but also made a series of incorrect "downgrades" — features were removed to match an incomplete schema instead of fixing the schema to match the features.

### Wrong Downgrades (now corrected)

| File | Phase 6C Wrong Change | Phase 6C-R Correct Fix |
|------|-----------------------|------------------------|
| `schema.prisma` | `unitCostSnapshot`, `totalCostSnapshot`, `previousStock`, `newStock` never added | Added all 4 fields to `StockMovement` |
| `inventory-cost-snapshot-repairs.ts` | Backfill no-op: returned message "No cost snapshot column exists" | Backfill now executes real `UPDATE StockMovement SET unitCostSnapshot, totalCostSnapshot` |
| `inventory-cost-snapshot-repairs.ts` | `listMissingCostSnapshots` detected items with no cost (`ii.costPerUnit <= 0`) instead of movements with no snapshot (`sm.unitCostSnapshot IS NULL`) | Fixed to filter on `sm.unitCostSnapshot IS NULL` |
| `inventory-cost-snapshot-repairs.ts` | `repairableOnly` filter was `AND false` — always returned zero candidates | Fixed to `AND ii.costPerUnit > 0` |
| `sales-analytics/repository.ts` | COGS used `ii.costPerUnit` only (mutable current cost) | COGS now prefers `sm.unitCostSnapshot`, falls back to `ii.costPerUnit` |
| `sales-analytics/repository.ts` | `stockMovementsMissingCostSnapshot` counted items with no cost | Now counts movements where `unitCostSnapshot IS NULL` |
| `financial-reports/reconciliation.ts` | `countMissingCostSnapshots` / `listMissingCostSnapshots` detected items with no cost | Fixed to check `unitCostSnapshot IS NULL` |
| Frontend copy (5 files) | "Missing Usable Inventory Cost" (item cost issue) | "COGS Movements Missing Cost Snapshot" (snapshot issue) |
| Repair panel copy | "Review Selected" / "Reviewing..." (no-op language) | "Backfill Snapshots" / "Backfilling..." (correct action language) |

### Correct Changes (preserved from Phase 6C)

- `businessId` scoping in `getSalesSourceHealth`, `getCogsByOrderIds`, `getFinancialReportReconciliation`
- Removal of unsafe Prisma delegate casts (`as unknown as V2Type`)

---

## Schema Changes

```prisma
model StockMovement {
  // ...existing fields...

  /// Stock level immediately before this movement was applied.
  previousStock   Float?

  /// Stock level immediately after this movement was applied.
  newStock        Float?

  /// Unit cost captured at movement time for historical COGS reporting.
  /// Null for movements that predate cost-snapshot tracking or were created
  /// without a cost context. Use InventoryItem.costPerUnit as a fallback
  /// estimate only — label it as an estimate in any UI or report.
  unitCostSnapshot  Decimal?

  /// Total cost at movement time: ABS(quantity) * unitCostSnapshot.
  /// Stored for efficiency so reports do not need to recalculate.
  totalCostSnapshot Decimal?

  // ...
  @@index([unitCostSnapshot])
}
```

**Migration:** `20260618000000_add_stock_movement_cost_snapshots`
Applied via `prisma migrate resolve --applied` (shadow DB cannot replay all migrations due to pre-existing `Restaurant` table issue in `20260610000000_add_invoice_module`).

---

## COGS Architecture (Authoritative)

### Source of truth: `unitCostSnapshot`

`StockMovement.unitCostSnapshot` is the **persisted historical cost** captured at the moment a stock movement was created. It does not change when item prices change. It is the only reliable source for historical COGS reporting.

### Fallback: `InventoryItem.costPerUnit`

`InventoryItem.costPerUnit` is a **mutable current cost**. Using it for historical COGS produces inaccurate results when prices have changed. It should only be used when `unitCostSnapshot` is NULL and should always be labeled as "estimated from current item cost" in any UI or report.

### COGS SQL Pattern

```sql
-- Prefer snapshot, fall back to current item cost
COALESCE(
  SUM(ABS(sm.quantity) * COALESCE(sm."unitCostSnapshot", ii."costPerUnit"::numeric)),
  0
)::double precision AS cogs
```

Movements with neither (`unitCostSnapshot IS NULL AND costPerUnit <= 0`) are excluded from COGS totals and counted in the `stockMovementsMissingCostSnapshot` health metric.

---

## Cost Snapshot Repair Workflow

### Classification

| Status | Condition | Action |
|--------|-----------|--------|
| `REPAIRABLE` | `unitCostSnapshot IS NULL AND ii.costPerUnit > 0` | Backfill can write current item cost as snapshot |
| `NEEDS_ITEM_COST` | `unitCostSnapshot IS NULL AND ii.costPerUnit <= 0` | User must set item cost first, then rerun repair |

### Backfill SQL

```sql
UPDATE "StockMovement" sm
SET
  "unitCostSnapshot"  = ii."costPerUnit"::numeric,
  "totalCostSnapshot" = ROUND(ABS(sm."quantity") * ii."costPerUnit"::numeric)
FROM "InventoryItem" ii
WHERE sm."inventoryItemId" = ii."id"
  AND sm."id" IN (/* repairable ids */)
  AND sm."businessId" = $businessId
  AND sm."unitCostSnapshot" IS NULL
  AND ii."costPerUnit" > 0
```

The repair uses current item cost as a proxy — this is a best-effort historical repair, labeled clearly in the UI. It is better than NULL for COGS reporting.

---

## Files Changed

### Backend
- `artifacts/api-server/prisma/schema.prisma` — 4 new fields on `StockMovement`
- `artifacts/api-server/prisma/migrations/20260618000000_add_stock_movement_cost_snapshots/migration.sql` — migration SQL
- `artifacts/api-server/src/routes/inventory-cost-snapshot-repairs.ts` — restored real backfill + correct query logic
- `artifacts/api-server/src/routes/inventory-movement-reports.ts` — removed manual type intersection (fields now native in Prisma types)
- `artifacts/api-server/src/routes/inventory-movement-anomalies.ts` — same; updated `isMissingCostSnapshot` to check `unitCostSnapshot IS NULL`
- `artifacts/api-server/src/services/sales-analytics/repository.ts` — COGS prefers `unitCostSnapshot`; health metric counts `unitCostSnapshot IS NULL`
- `artifacts/api-server/src/services/sales-analytics/sales-analytics.dto.ts` — accurate warning message
- `artifacts/api-server/src/services/financial-reports/reconciliation.ts` — count/list missing snapshots via `unitCostSnapshot IS NULL`

### Frontend
- `artifacts/pos-system/src/features/shared/inventory/inventory-cost-snapshot-repair-panel.tsx` — restored backfill action copy
- `artifacts/pos-system/src/features/shared/financial-reports/financial-reports-dashboard.tsx` — restored "Missing Cost Snapshot" heading
- `artifacts/pos-system/src/features/shared/financial-reports/financial-reports-reconciliation-drilldown-panel.tsx` — restored message + emptyMessage
- `artifacts/pos-system/src/features/shared/sales/sales-analytics-dashboard.tsx` — restored "Missing Cost Snapshot" heading
- `artifacts/pos-system/src/features/shared/sales/sales-analytics-reconciliation-drilldown-panel.tsx` — same
- `artifacts/pos-system/src/features/shared/sales/sales-analytics-synced-reconciliation-drilldown-panel.tsx` — same

---

## Key Invariants

1. **Never read `InventoryItem.costPerUnit` for historical COGS without prefering `unitCostSnapshot` first.**
2. **A "missing cost snapshot" is `sm.unitCostSnapshot IS NULL` — not `ii.costPerUnit <= 0`.** These are different conditions.
3. **`repairableOnly: true` must filter `ii.costPerUnit > 0`** — not `AND false`.
4. **`previousStock` and `newStock` are stock level snapshots on the movement, not inventory item fields.** Set them when creating movements.
5. **When Prisma migrate dev fails with shadow DB issues**, use the `migrate resolve --applied` pattern after applying SQL directly with pg driver.
