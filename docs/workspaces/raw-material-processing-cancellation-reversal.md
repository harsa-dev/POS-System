# Raw Material Processing Cancellation Reversal Workflow

## Status

Implemented.

## Goal

Phase 8D makes processing cancellation safer after stock has already been consumed for a processing run.

Before this phase, cancelling a processing run only changed the run status. If the run had already consumed input batch stock through `POST /raw-material/stock-movements/consume-processing`, the consumed batch quantity and storage usage stayed reduced.

This phase changes the explicit workflow status route so cancellation can restore consumed stock with a linked correction ledger row.

## Implemented files

```txt
artifacts/api-server/src/services/raw-material/raw-material-processing-cancellation-reversal.service.ts
artifacts/api-server/src/services/raw-material/raw-material-status.service.ts
artifacts/api-server/src/services/raw-material/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material-workflow-status.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-workflow-status-actions.tsx
docs/workspaces/raw-material-processing-cancellation-reversal.md
```

## Frontend entry point

Frontend status actions still use the Phase 8A route family:

```txt
POST /raw-material/status/processing-runs/{id}
```

Payload:

```json
{
  "status": "CANCELLED",
  "note": "Cancel processing and reverse consumed input stock when a production usage ledger exists."
}
```

The cancellation form now includes a cancellation note. The note is passed into backend audit and reversal ledger notes.

## Backend behavior

When `status=CANCELLED` is submitted for a processing run, `raw-material-status.service.ts` now calls:

```txt
cancelRawMaterialProcessingRunWithStockReversal()
```

The service:

```txt
1. Loads the processing run in the active business context.
2. Applies the existing processing status transition guard.
3. Looks for a linked PRODUCTION_USAGE stock movement where source=PROCESSING_RUN and sourceId=processingRunId.
4. If no consumption movement exists, only cancels the processing run.
5. If a consumption movement exists, validates reversal eligibility.
6. Restores batch remaining quantity.
7. Restores storage used quantity.
8. Creates a SYSTEM/CORRECTION stock movement linked to the original consumption movement.
9. Marks the processing run CANCELLED.
10. Writes an audit log for the cancellation and stock reversal.
```

## Reversal eligibility

A processing consumption movement can be reversed only when:

```txt
type = PRODUCTION_USAGE
reason = PRODUCTION_USAGE
source = PROCESSING_RUN
sourceId = processingRunId
quantity > 0
beforeQuantity is present
afterQuantity is present
sourceStorageLocationId is present
```

## Idempotency guard

The service checks whether a reversal already exists:

```txt
type = CORRECTION
reason = CORRECTION
source = SYSTEM
sourceId = originalConsumptionMovementId
```

If a reversal already exists, cancellation returns a conflict instead of applying stock twice.

## Storage guard

The input batch must still be in the original consumption storage location.

If the batch moved after consumption, cancellation with automatic stock reversal is rejected. The operator must move the batch back or apply a separate correction.

This avoids pretending a historical reversal is valid after stock has already been moved elsewhere. Charming little thing called causality, apparently.

## Ledger behavior

Original production usage movement is never deleted.

The reversal creates a new movement:

```txt
type = CORRECTION
reason = CORRECTION
source = SYSTEM
sourceId = originalConsumptionMovementId
sourceStorageLocationId = batch.storageLocationId
targetStorageLocationId = batch.storageLocationId
quantity = originalConsumption.quantity
beforeQuantity = current batch remaining quantity
afterQuantity = current batch remaining quantity + reversal quantity
```

This keeps a clear audit trail:

```txt
PRODUCTION_USAGE movement: stock consumed for processing
CORRECTION movement: consumed stock restored because processing was cancelled
```

## Audit behavior

Audit action:

```txt
UPDATE RawMaterialProcessingRun
```

Audit changes include:

```txt
operation = cancel-processing-with-stock-reversal
before processing run dto
result processing run dto
consumptionMovementId
reversalMovementId
beforeQuantity
afterQuantity
beforeStorageUsedKg
afterStorageUsedKg
```

If no consumption movement existed, `stockReversal` is null.

## Frontend behavior

The workflow status UI keeps the same `Cancel processing run` action, but now includes a cancellation note input.

After a successful cancellation, workflow reads refresh. This refreshes:

```txt
processing run status
batch remaining quantity
storage usage
stock movement trail
```

The UI remains disabled when workflow reads fall back to mock data.

## Non-goals

```txt
No Prisma schema changes
No migration changes
No deletion of original stock movement rows
No processing completion reversal
No output/byproduct inventory creation
No transfer reversal
No stock adjustment reversal changes
No global non-Raw-Material typecheck cleanup
```

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
Raw Material Phase 8E - Generated API client consolidation
```
