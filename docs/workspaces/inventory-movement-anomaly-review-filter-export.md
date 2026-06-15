# Inventory Movement Anomaly Review Filter & Export

## 1. Scope

This phase completes the review workflow for Inventory Movement Anomaly Reconciliation.

The anomaly panel now supports server-side review filtering and review-aware export for:

- `UNREVIEWED`
- `REVIEWED`
- `IGNORED`
- `RESOLVED`

This is intentionally separate from automatic repair. Review state is an audit workflow, not a mutation that changes stock values.

## 2. Backend endpoints

Existing endpoints were extended:

```txt
GET /api/inventory-movement-anomalies
GET /api/inventory-movement-anomalies/export?format=csv
GET /api/inventory-movement-anomalies/export?format=json
```

Supported review filter:

```txt
reviewStatus=UNREVIEWED
reviewStatus=REVIEWED
reviewStatus=IGNORED
reviewStatus=RESOLVED
```

`reviewStatus=ALL` or omitted returns every anomaly regardless of review state.

## 3. Review join strategy

The backend builds anomaly rows from `StockMovement + InventoryItem`, then joins review state from the runtime table:

```txt
InventoryMovementAnomalyReview
```

Join key:

```txt
businessId + anomalyId
```

The anomaly id format remains:

```txt
<movementId>:<anomalyType>
```

This format must remain stable because it is used as the review key.

## 4. Export state

CSV export now includes:

```txt
Review Status
Review Note
Reviewed By
Reviewed At
```

JSON export includes the same review fields on each row:

```txt
reviewStatus
reviewNote
reviewedById
reviewedAt
```

Unreviewed rows export as:

```txt
UNREVIEWED
```

## 5. Frontend behavior

The Inventory Movement Anomaly panel now includes a `Review` filter dropdown:

```txt
All Review States
Unreviewed
Reviewed
Ignored
Resolved
```

The active review filter is sent to:

- anomaly report load
- CSV export
- JSON export

After a review is saved, the panel reloads the backend report. This keeps filtered views honest. For example, a row saved as `RESOLVED` should disappear from an `UNREVIEWED` view after reload.

## 6. Guard policy

The endpoints remain under Inventory Management guard:

```txt
management-only
custom-business blocked as planned mode
```

## 7. Validation checklist

Run:

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual smoke test:

1. Open Inventory Management as OWNER/MANAGER.
2. Open Inventory Movement Anomaly Reconciliation.
3. Filter Review = `Unreviewed`.
4. Save a row as `Reviewed` with a note.
5. Confirm the row disappears from `Unreviewed` after reload.
6. Filter Review = `Reviewed` and confirm the row appears.
7. Export CSV and confirm review columns exist.
8. Export JSON and confirm review fields exist.
9. Confirm non-management role is blocked by the Inventory Management guard.

## 8. Known cautions

- `InventoryMovementAnomalyReview` is a runtime raw SQL table, not a Prisma model.
- Review key stability depends on the anomaly id format `<movementId>:<anomalyType>`.
- Review filtering happens after anomaly detection, because anomalies are computed from movement definitions.
- Export rows respect the same anomaly filters and review filter.
