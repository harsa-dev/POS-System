# Inventory Management - Stock Movement Report & Export

## Scope

This phase adds a backend-backed stock movement report surface for Inventory Management.

The existing Inventory Management dashboard still owns operational item and stock movement workflows. The new report panel is audit-oriented and uses backend filtering/export instead of relying on browser state.

## Backend routes

```txt
GET /api/inventory-movement-reports
GET /api/inventory-movement-reports/export?format=csv
GET /api/inventory-movement-reports/export?format=json
```

## Supported filters

```txt
search
inventoryItemId
type
reason
sourceType
sourceId
from
to
sort
limit
```

Supported sort values:

```txt
NEWEST
OLDEST
HIGHEST_QUANTITY
HIGHEST_VALUE
```

## Export columns

CSV export includes:

```txt
Movement ID
Created At
Item
SKU
Item Type
Unit
Movement Type
Quantity
Reason
Source Type
Source ID
Previous Stock
New Stock
Unit Cost Snapshot
Fallback Cost Per Unit
Movement Value
Actor ID
Note
```

`movementValue` uses `unitCostSnapshot` when available and falls back to the current item `costPerUnit` when the snapshot is missing. That fallback is intentionally visible in the export so audit reviewers can spot repaired or legacy movement rows.

## Guard policy

The movement report is protected by `inventoryManagementGuardRouter`.

Current policy remains management-only:

```txt
OWNER / MANAGER / ADMIN: allowed
custom-business mode: blocked as planned
non-management roles: blocked
```

The guard now covers:

```txt
GET /api/inventory-movement-reports
GET /api/inventory-movement-reports/export
```

## Frontend surface

New panel:

```txt
artifacts/pos-system/src/features/shared/inventory/inventory-movement-report-panel.tsx
```

Workspace order:

```tsx
<InventoryBackendReportPanel />
<InventoryMovementReportPanel />
<InventoryCostSnapshotRepairPanel />
<InventoryManagementDashboard />
```

The item report answers: "what is the current stock state?"
The movement report answers: "how did stock move and why?"
The legacy dashboard still answers: "how do I create/update items and stock movements?"

## Validation checklist

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual smoke test:

1. Open Inventory Management as OWNER/MANAGER.
2. Confirm Backend Inventory Report loads.
3. Confirm Backend Stock Movement Report loads.
4. Filter by `IN`, `OUT`, and `ADJUSTMENT`.
5. Filter by reason and source type.
6. Filter by date range.
7. Export movement CSV and JSON.
8. Create a stock movement in the operational dashboard.
9. Refresh the movement report and confirm the new row appears.
10. Confirm non-management roles are blocked by the workspace/guard.

## Known cautions

1. The movement report is backend-backed, but the legacy operational dashboard can still show local movement views.
2. `movementValue` can use current `costPerUnit` as fallback when old movements have no `unitCostSnapshot`.
3. `HIGHEST_VALUE` sorting fetches up to export limit and sorts computed movement value in memory.
4. Business scoping relies on the related `inventoryItem.businessId` for legacy-safe movement reads.
