# Inventory Movement Anomaly Review State

## Summary

Inventory Movement Anomaly Reconciliation now supports persistent review state for detected stock movement anomalies.

This phase adds review workflow only. It does not auto-repair anomalies and it does not yet make anomaly export review-aware.

## Backend routes

New routes:

```txt
GET  /api/inventory-movement-anomalies/reviews
POST /api/inventory-movement-anomalies/reviews
```

The routes are mounted behind `inventoryMovementAnomaliesGuardRouter` in `app.ts`.

## Review table

Runtime table:

```txt
InventoryMovementAnomalyReview
```

Columns:

```txt
businessId
anomalyId
anomalyType
movementId
status
note
reviewedById
createdAt
updatedAt
```

Unique key:

```txt
businessId + anomalyId
```

The anomaly id follows the anomaly report row id:

```txt
<movementId>:<anomalyType>
```

## Review statuses

Supported statuses:

```txt
REVIEWED
IGNORED
RESOLVED
```

Review note is required before saving.

## Business safety

Before saving a review, the backend validates that the stock movement belongs to the active business by checking the movement through `inventoryItem: createBusinessScopeWhere(businessContext)`.

This prevents a user from saving review state against a movement outside the current business.

## Frontend behavior

The Inventory Movement Anomaly panel now loads:

```txt
GET /api/inventory-movement-anomalies
GET /api/inventory-movement-anomalies/reviews
```

Then it merges review rows into anomaly rows by `anomalyId`.

Each anomaly row now has:

```txt
review status
review note textarea
Save Review action
```

The panel also shows review summary cards:

```txt
Reviewed
Resolved
Ignored
Unreviewed
```

## Current limitations

- Anomaly CSV/JSON export does not yet include review state.
- There is no server-side review filter yet.
- Review table is runtime raw SQL, not a Prisma schema model.
- Review state is keyed by generated anomaly id, so changing anomaly id format would affect lookup compatibility.

## Next recommended phase

Add review filter + review-aware export:

```txt
reviewStatus=all|unreviewed|REVIEWED|IGNORED|RESOLVED
```

Then include review status, note, reviewedBy, and reviewedAt in anomaly CSV/JSON export.
