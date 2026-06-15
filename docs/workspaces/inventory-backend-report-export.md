# Inventory Management Backend Report & Export

## Scope

This phase adds a backend-backed reporting surface for Inventory Management without rewriting the existing operational inventory dashboard.

The legacy shared dashboard still owns item creation, stock movement, import, stock analysis, and loss workflows. The new report panel owns backend-filtered table rows and CSV/JSON export.

## Backend routes

Mounted after `inventoryManagementGuardRouter` and before legacy inventory routes:

```ts
router.use(inventoryManagementGuardRouter);
router.use(inventoryReportsRouter);
router.use(inventoryCostSnapshotRepairsRouter);
router.use(inventoryRouter);
```

### GET `/api/inventory-reports`

Returns backend-filtered inventory rows and summary.

Supported query:

```txt
search
status=LOW_STOCK | OUT_OF_STOCK | IN_STOCK
type=INGREDIENT | PACKAGING | EQUIPMENT | PRODUCT | RAW_MATERIAL | FINISHED_GOOD | SUPPLY | TOOL | SPARE_PART | FEED | MEDICINE
lowStock=true
sort=HIGHEST_VALUE | LOWEST_STOCK | ITEM_NAME | NEWEST
limit=number
```

### GET `/api/inventory-reports/export`

Supports:

```txt
format=csv
format=json
```

CSV export includes:

```txt
Item ID
Name
SKU
Type
Unit
Current Stock
Minimum Stock
Stock Status
Cost Per Unit
Stock Value
Recipe Count
Movement Count
Updated At
```

JSON export returns rows plus export metadata.

## Guard policy

Inventory report routes use the same inventory management guard as the operational dashboard.

Current policy is management-only because the dashboard still mixes read/report surfaces with stock mutation tools.

## Frontend

New component:

```txt
artifacts/pos-system/src/features/shared/inventory/inventory-backend-report-panel.tsx
```

Workspace order:

```tsx
<InventoryBackendReportPanel />
<InventoryCostSnapshotRepairPanel />
<InventoryManagementDashboard />
```

## Current behavior

The new report panel provides:

- backend filtered rows
- backend summary cards
- search/type/status/low-stock/sort filters
- backend CSV export
- backend JSON export

The existing dashboard below remains operational and still handles inventory mutation workflows.

## Validation checklist

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual smoke test:

1. Open Inventory Management as OWNER/MANAGER.
2. Confirm Backend Inventory Report loads above the operational dashboard.
3. Apply search/type/status/low-stock filters.
4. Export CSV and confirm filtered rows.
5. Export JSON and confirm reviewable payload.
6. Confirm non-management role is blocked by the guard.
7. Confirm custom-business mode is blocked as planned.

## Known caution

- Inventory report status is computed from `currentStock` and `minimumStock` after the base DB query.
- Existing operational dashboard still has local filtering and client-side export for its legacy table.
- `restaurantId` remains in some DTOs for legacy compatibility while shared inventory continues migrating to `businessId`.
