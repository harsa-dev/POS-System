# Raw Material Workflow Guards

Status: implemented.

This document records Phase 3 of the Raw Material backend phase plan.

## Goal

Add domain guards for status changes and stock-sensitive actions without changing Prisma schema or migrations.

## Implemented files

```txt
artifacts/api-server/src/services/raw-material/raw-material.workflow.ts
artifacts/api-server/src/services/raw-material/raw-material.stock-rules.ts
artifacts/api-server/src/services/raw-material/raw-material-processing-run.service.ts
artifacts/api-server/src/services/raw-material/raw-material-pen.service.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.types.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.validation.ts
artifacts/api-server/src/services/raw-material/index.ts
```

## Workflow guard helper

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material.workflow.ts
```

Covered invariants:

```txt
Cancelled intake cannot be updated.
Intake with active batches cannot be cancelled.
Batch can only be created from accepted or partially rejected intake with accepted quantity.
Batch remaining quantity must stay between zero and total quantity.
Processing input batch must be active, accepted, and have remaining quantity.
Processing run can only be created as PLANNED or RUNNING.
Processing status transitions are explicit.
Processing output + byproduct + waste cannot exceed input quantity.
Only RUNNING or COMPLETED processing runs can consume stock.
Kandang occupancy must stay between zero and capacity.
Feed batch must be active, accepted, and have remaining quantity.
Inactive kandang pen cannot be marked critical.
```

## Processing transition matrix

```txt
PLANNED   -> PLANNED, RUNNING, CANCELLED
RUNNING   -> RUNNING, COMPLETED, CANCELLED
COMPLETED -> COMPLETED
CANCELLED -> CANCELLED
```

The processing route behavior is still the same at route level. The service now rejects invalid state transitions before persistence.

## Stock rule helper

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material.stock-rules.ts
```

Covered invariants:

```txt
Stock movement currently supports KG batches only.
Remaining quantity cannot become negative.
Remaining quantity cannot exceed original batch quantity.
Storage used quantity cannot become negative.
Storage capacity cannot be exceeded when capacityKg > 0.
Movement quantity must be positive.
Transfer target storage must differ from source storage.
Manual adjustment or correction requires a note.
```

## Stock enum alignment

Raw Material stock movement reason/source types were aligned with Prisma schema enums.

Important correction:

```txt
Old service literals: TRANSFER, PROCESSING_USAGE
Prisma enum literals: TRANSFER_IN, TRANSFER_OUT, PRODUCTION_USAGE
```

The stock movement write path now uses:

```txt
TRANSFER_OUT movement -> reason TRANSFER_OUT
TRANSFER_IN movement  -> reason TRANSFER_IN
PRODUCTION_USAGE      -> reason PRODUCTION_USAGE
```

This avoids runtime enum-cast failures when inserting stock movement records.

## Service integration

### Processing runs

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-processing-run.service.ts
```

Integrated guards:

```txt
assertRawMaterialBatchAcceptedForProcessing()
assertRawMaterialProcessingInitialStatus()
assertRawMaterialProcessingStatusTransition()
assertRawMaterialProcessingOutputWithinInput()
```

### Kandang pens

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-pen.service.ts
```

Integrated guards:

```txt
assertRawMaterialKandangCapacity()
assertRawMaterialFeedBatchAllowed()
assertRawMaterialKandangHealthCanBeSet()
```

### Stock movements

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
```

Integrated guards:

```txt
assertRawMaterialKgBatch()
assertRawMaterialQuantityRange()
assertRawMaterialStorageUsage()
assertRawMaterialPositiveMovementQuantity()
assertRawMaterialDifferentStorage()
assertRawMaterialManualAdjustmentNote()
assertRawMaterialProcessingCanConsumeStock()
```

## Not changed

```txt
No Prisma schema change.
No migration.
No route path change.
No frontend contract change.
No Service Business change.
No Restaurant mode change.
```

## Required local validation

Run:

```bash
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run typecheck
```

Focus on Raw Material files first:

```txt
src/services/raw-material/raw-material.workflow.ts
src/services/raw-material/raw-material.stock-rules.ts
src/services/raw-material/raw-material-processing-run.service.ts
src/services/raw-material/raw-material-pen.service.ts
src/services/raw-material/raw-material-stock-movement.service.ts
src/routes/raw-material*.ts
```

## Next phase

Proceed to Phase 4:

```txt
Service layer cleanup.
```

Recommended order:

```txt
1. stock movement repository/service split
2. processing run repository/service split
3. intake and batch workflow split
4. supplier/storage/pens cleanup
```
