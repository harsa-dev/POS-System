# Inventory Management Final Audit

## 1. Scope

Inventory Management is now treated as a guarded shared dashboard, not a loose stock table with mutation buttons sprinkled around like confetti.

This audit covers:

- inventory access guard
- item report and export
- stock movement report and export
- movement anomaly reconciliation
- movement anomaly review workflow
- review-aware anomaly export
- cost snapshot repair flow
- workspace panel order
- validation checklist and known cautions

## 2. Backend route order

Inventory routes are split across `routes/index.ts` and `app.ts`.

### 2.1 Main inventory route order

`artifacts/api-server/src/routes/index.ts` mounts the main inventory stack in this order:

```ts
router.use(inventoryManagementGuardRouter);
router.use(inventoryReportsRouter);
router.use(inventoryMovementReportsRouter);
router.use(inventoryCostSnapshotRepairsRouter);
router.use(inventoryRouter);
```

This means the management guard runs before item report/export, movement report/export, cost snapshot repair, and legacy inventory routes.

### 2.2 Movement anomaly route order

`artifacts/api-server/src/app.ts` mounts movement anomaly routes before the main router:

```ts
app.use("/api", inventoryMovementAnomaliesGuardRouter);
app.use("/api", inventoryMovementAnomaliesReviewRouter);
app.use("/api", inventoryMovementAnomaliesRouter);
app.use("/api", router);
```

This route lives in `app.ts` because updating `routes/index.ts` was blocked during the anomaly phase. The important invariant is still preserved: anomaly guard first, anomaly review route second, anomaly report/export route third.

## 3. Capability policy

Inventory Management is intentionally management-only for now.

Allowed roles:

- `OWNER`
- `MANAGER`
- `ADMIN`

Blocked roles:

- `CASHIER`
- `KITCHEN`
- `SERVER`

Blocked mode:

- `custom-business`, marked as planned/not operational.

Current capability surface:

```txt
canView
canCreateItem
canUpdateItem
canDeleteItem
canMoveStock
canImport
canExport
canRepairCostSnapshots
isPlannedMode
plannedReason
```

Read-only inventory access is not enabled yet because the existing dashboard still contains item CRUD, stock movement, imports, and repair workflows in the same surface.

## 4. Guarded backend surfaces

The inventory management guard currently protects:

```txt
GET  /api/inventory-management-capabilities
GET  /api/inventory-capabilities
GET  /api/inventory-dashboard
GET  /api/inventory-items
POST /api/inventory-items
PATCH /api/inventory-items/:id
DELETE /api/inventory-items/:id
GET  /api/inventory
POST /api/inventory
GET  /api/inventory-reports
GET  /api/inventory-reports/export
GET  /api/inventory-movement-reports
GET  /api/inventory-movement-reports/export
GET  /api/inventory-cost-snapshot-repairs
POST /api/inventory-cost-snapshot-repairs/backfill
```

The movement anomaly guard separately protects:

```txt
GET  /api/inventory-movement-anomalies
GET  /api/inventory-movement-anomalies/export
GET  /api/inventory-movement-anomalies/reviews
POST /api/inventory-movement-anomalies/reviews
```

## 5. Frontend workspace order

`InventoryManagementWorkspace` is the active page-level workspace.

After capabilities pass, it renders:

```tsx
<InventoryBackendReportPanel />
<InventoryMovementReportPanel />
<InventoryMovementAnomalyPanel />
<InventoryCostSnapshotRepairPanel />
<InventoryManagementDashboard />
```

The order is deliberate:

1. current stock report
2. movement ledger report
3. anomaly reconciliation/review
4. cost snapshot repair
5. operational dashboard for CRUD/movement/import workflows

## 6. Item report/export

Backend endpoints:

```txt
GET /api/inventory-reports
GET /api/inventory-reports/export?format=csv
GET /api/inventory-reports/export?format=json
```

Supported filters:

```txt
search
type
status
lowStock
sort
limit
```

The frontend `InventoryBackendReportPanel` uses these endpoints for backend-backed table rows, summary cards, and CSV/JSON export.

## 7. Stock movement report/export

Backend endpoints:

```txt
GET /api/inventory-movement-reports
GET /api/inventory-movement-reports/export?format=csv
GET /api/inventory-movement-reports/export?format=json
```

Supported filters:

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

The frontend `InventoryMovementReportPanel` uses these endpoints for the movement ledger, movement summary, and CSV/JSON export.

Movement value uses:

```txt
unitCostSnapshot fallback to InventoryItem.costPerUnit
```

That fallback is intentional for old/repaired data, but it is not the same as historical cost if the item cost changed later.

## 8. Movement anomaly reconciliation

Backend endpoints:

```txt
GET /api/inventory-movement-anomalies
GET /api/inventory-movement-anomalies/export?format=csv
GET /api/inventory-movement-anomalies/export?format=json
```

Detected anomaly types:

```txt
NEGATIVE_STOCK
MISSING_COST_SNAPSHOT
SUSPICIOUS_ADJUSTMENT
HIGH_VALUE_MOVEMENT
```

Supported review filters:

```txt
ALL
UNREVIEWED
REVIEWED
IGNORED
RESOLVED
```

The frontend `InventoryMovementAnomalyPanel` supports anomaly filters, severity filters, date/source filters, threshold tuning, CSV/JSON export, and cost repair shortcuts for missing cost snapshot rows.

## 9. Movement anomaly review workflow

Runtime review table:

```txt
InventoryMovementAnomalyReview
```

Unique key:

```txt
businessId + anomalyId
```

Supported review statuses:

```txt
REVIEWED
IGNORED
RESOLVED
```

Review note is required. A status without a reason is just a sticker pretending to be governance.

Review endpoints:

```txt
GET  /api/inventory-movement-anomalies/reviews
POST /api/inventory-movement-anomalies/reviews
```

The backend validates that the submitted `movementId` belongs to the current business context before saving review state.

## 10. Review-aware export

Movement anomaly CSV/JSON export now includes:

```txt
Review Status
Review Note
Reviewed By
Reviewed At
```

Export respects anomaly filters and review filters. This matters because exporting `Unreviewed` should not quietly export everything and make the user do spreadsheet archaeology.

## 11. Cost snapshot repair flow

Cost repair endpoints:

```txt
GET  /api/inventory-cost-snapshot-repairs
POST /api/inventory-cost-snapshot-repairs/backfill
```

Repair flow:

1. Financial Reports or Sales Analytics identifies missing cost snapshots.
2. Bridge opens Inventory repair panel.
3. Inventory preview lists repairable movements.
4. Backfill writes `StockMovement.unitCostSnapshot = InventoryItem.costPerUnit`.
5. Backend writes audit log per repaired movement.
6. Inventory can send repair feedback back to Financial Reports.

Important assumption:

```txt
Backfill uses current InventoryItem.costPerUnit, not historical cost.
```

## 12. Validation checklist

Run builds:

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual smoke tests:

1. Open Inventory as `OWNER` or `MANAGER`.
2. Confirm the guarded workspace loads before any inventory panel.
3. Confirm non-management role is blocked.
4. Confirm `custom-business` mode is blocked.
5. Use item report filters and export CSV/JSON.
6. Use movement report filters and export CSV/JSON.
7. Trigger movement anomaly filters for each anomaly type.
8. Save anomaly review with required note.
9. Filter anomaly report by `UNREVIEWED`, `REVIEWED`, `IGNORED`, and `RESOLVED`.
10. Export anomaly CSV/JSON and confirm review fields are present.
11. Open missing cost snapshot anomaly and jump to cost repair panel.
12. Run cost snapshot preview/backfill with a known repairable movement.
13. Confirm old operational inventory dashboard still supports item/movement workflows for management role.

## 13. Known cautions

- `InventoryMovementAnomalyReview` is a runtime raw SQL table, not a Prisma schema model.
- `InventoryMovementAnomaly` rows are computed from movement rules, not persisted anomaly records.
- `anomalyId` format is currently `<movementId>:<anomalyType>` and must stay stable for review matching.
- Movement anomaly routes are app-level mounts in `app.ts`, not in `routes/index.ts`.
- Review filtering happens after anomaly detection.
- High-value and suspicious-adjustment thresholds are defaulted and may need business-specific tuning.
- Movement value fallback uses current item cost when `unitCostSnapshot` is missing.
- Legacy inventory domain still has `restaurantId` compatibility in parts of the stack.

## 14. Current final status

```txt
Management-only guard ✅
Guarded workspace ✅
Backend item report/export ✅
Backend movement report/export ✅
Movement anomaly reconciliation ✅
Movement anomaly CSV/JSON export ✅
Movement anomaly review state ✅
Review filter backend/UI ✅
Review-aware anomaly export ✅
Cost snapshot repair flow ✅
Operational inventory dashboard preserved ✅
Final audit doc ✅
```
