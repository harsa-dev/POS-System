# Raw Material Phase 8C - Stock Adjustment Reversal Workflow

Status: implemented.

## Goal

Add a guarded reversal workflow for Raw Material stock adjustments.

The reversal workflow does not delete or edit the original ledger row. It creates a new system-generated correction movement that reverses the original adjustment delta.

## Implemented files

```txt
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.types.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.validation.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
artifacts/api-server/src/routes/raw-material-stock-movements.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material-stock-write.api-client.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-stock-write-actions.tsx
docs/workspaces/raw-material-stock-adjustment-reversal.md
```

## New backend endpoint

```txt
POST /raw-material/stock-movements/{id}/reverse-adjustment
```

Permission:

```txt
raw-material.stock.adjust
```

Business guard:

```txt
requireBusinessMode(["raw-material"])
requireBusinessContextForRequest(...)
```

## Request body

```json
{
  "note": "Reverse incorrect adjustment after approval."
}
```

The route injects `{id}` as the target `movementId`.

## Reversal eligibility rules

The original movement must be:

```txt
type   = ADJUSTMENT
source = MANUAL or STOCK_COUNT
sourceId = null
quantity > 0
beforeQuantity exists
afterQuantity exists
sourceStorageLocationId exists
targetStorageLocationId exists
sourceStorageLocationId == targetStorageLocationId
```

The original movement cannot be:

```txt
SYSTEM-generated
already linked to another sourceId
already reversed
non-adjustment transfer/processing/receiving movement
```

## Idempotency guard

The repository checks whether a system-generated adjustment already exists with:

```txt
source = SYSTEM
sourceId = originalMovementId
```

If one exists, the API returns conflict instead of creating a second reversal.

## Storage guard

The batch must still be in the same storage location as the original adjustment.

If the batch has moved since the original adjustment, the API rejects reversal and asks the user to move it back or apply a new correction.

This avoids reversing historical stock into the wrong storage location.

## Reversal ledger behavior

Given original movement:

```txt
beforeQuantity = A
afterQuantity  = B
```

The reversal delta is:

```txt
reverseDelta = A - B
```

The reversal creates a new movement:

```txt
type   = ADJUSTMENT
reason = CORRECTION
source = SYSTEM
sourceId = originalMovementId
quantity = abs(reverseDelta)
beforeQuantity = current batch remaining
afterQuantity = current batch remaining + reverseDelta
```

The original ledger remains untouched.

## Audit behavior

The service writes a RawMaterialStockMovement audit log with:

```txt
operation = reverse-adjustment
originalMovementId
reversalMovementId
batchId
reverseDelta
beforeQuantity
afterQuantity
beforeStorageUsedKg
afterStorageUsedKg
```

## Frontend behavior

The existing guarded stock write card now includes a fourth action:

```txt
Reverse adjustment
```

The UI:

```txt
loads backend workflow reads first
filters reversible adjustment movements
requires a reversal note
uses only backend movement IDs
submits POST /raw-material/stock-movements/{id}/reverse-adjustment
refreshes workflow reads after success
keeps write disabled when API workflow reads fail
```

## Non-goals

```txt
No deletion of original ledger rows
No reversal for transfers
No reversal for processing consumption
No reversal for receiving/intake movements
No Prisma schema change
No migration
No global non-Raw-Material cleanup
```

Processing cancellation reversal remains Phase 8D.

## Validation

Run:

```bash
pnpm raw-material:check -- --no-smoke
```

Full gate:

```bash
pnpm raw-material:check
```

## Next phase

```txt
Phase 8D - Processing cancellation reversal workflow
```
