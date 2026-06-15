# Inventory Movement Anomaly Reconciliation

## Scope

This phase adds a backend-backed anomaly reconciliation surface for Inventory Management. It does not replace the stock movement report or the operational stock movement dashboard.

The goal is to flag risky movement rows for management review:

- negative stock transitions
- missing unit cost snapshots on COGS movements
- suspicious stock adjustments
- high-value stock movements

## Backend endpoints

```txt
GET /api/inventory-movement-anomalies
GET /api/inventory-movement-anomalies/export?format=csv
GET /api/inventory-movement-anomalies/export?format=json
```

Supported query fields:

```txt
search
inventoryItemId
anomalyType
severity
reason
sourceType
sourceId
from
to
highValueThreshold
adjustmentThreshold
limit
```

## Detection rules

### NEGATIVE_STOCK

Raised when `previousStock` or `newStock` is below zero.

Severity:

```txt
newStock < 0      -> CRITICAL
previousStock < 0 -> WARNING
```

### MISSING_COST_SNAPSHOT

Raised when an `OUT` movement has no positive `unitCostSnapshot`.

Severity:

```txt
InventoryItem.costPerUnit > 0 -> WARNING
InventoryItem.costPerUnit <= 0 -> CRITICAL
```

### SUSPICIOUS_ADJUSTMENT

Raised for `ADJUSTMENT` movements with reason:

```txt
MANUAL_ADJUSTMENT
CORRECTION
STOCK_COUNT
```

and quantity or stock delta above `adjustmentThreshold`.

### HIGH_VALUE_MOVEMENT

Raised when movement value reaches `highValueThreshold`.

Value is calculated from:

```txt
(unitCostSnapshot ?? InventoryItem.costPerUnit ?? 0) * quantity
```

Severity:

```txt
value >= threshold * 3 -> CRITICAL
value >= threshold     -> WARNING
```

## Route order note

The route is mounted from `app.ts` because `routes/index.ts` update was blocked by the connector during this phase.

App-level order:

```txt
invoice guard/history
inventory movement anomaly guard
inventory movement anomaly route
customers/partners routes
main router
```

The anomaly route has its own guard route to preserve management-only access and planned-mode blocking.

## Frontend surface

New panel:

```txt
artifacts/pos-system/src/features/shared/inventory/inventory-movement-anomaly-panel.tsx
```

Workspace order:

```tsx
<InventoryBackendReportPanel />
<InventoryMovementReportPanel />
<InventoryMovementAnomalyPanel />
<InventoryCostSnapshotRepairPanel />
<InventoryManagementDashboard />
```

The anomaly panel can jump to the cost snapshot repair panel for missing cost snapshot issues.

## Validation checklist

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual smoke test:

1. Login as OWNER/MANAGER.
2. Open Inventory Management.
3. Confirm anomaly panel loads.
4. Filter by `MISSING_COST_SNAPSHOT`.
5. Click `Open cost repair` and confirm scroll to repair panel.
6. Export anomaly CSV.
7. Export anomaly JSON.
8. Login as non-management role and confirm access is blocked.
9. Switch to custom-business mode and confirm planned-mode block.

## Known cautions

- The anomaly route is app-mounted rather than index-mounted due connector blocking.
- `HIGH_VALUE_MOVEMENT` threshold defaults to `1,000,000` and should be tuned per business currency scale.
- `SUSPICIOUS_ADJUSTMENT` threshold defaults to `50` units and may be too high/low for some businesses.
- Missing cost snapshot detection intentionally overlaps with the cost snapshot repair workflow.
- Movement value falls back to current item cost if historical snapshot is missing.
