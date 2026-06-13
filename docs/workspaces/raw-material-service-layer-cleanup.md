# Raw Material Service Layer Cleanup

Status: Phase 4A, Phase 4B, and Phase 4C implemented.

This document records Phase 4 of the Raw Material backend plan.

Phase 4 is intentionally split into smaller subphases because Raw Material already has multiple production-backed service files. Rewriting every service boundary at once would be high risk and hard to validate.

## Phase 4A - Stock movement repository split

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
```

Goal:

```txt
Move stock movement persistence details out of the orchestration service.
```

Before this phase, `raw-material-stock-movement.service.ts` owned too many responsibilities:

```txt
permission checks
input validation
Prisma transaction orchestration
raw SQL insert/list/find queries
batch/storage loading
stock invariant guards
DTO mapping
```

After this phase:

```txt
raw-material-stock-movement.repository.ts owns persistence helpers.
raw-material-stock-movement.service.ts owns orchestration, validation, guards, and DTO mapping.
```

Repository exports:

```txt
RawMaterialRepositoryTx
RawMaterialStockMovementInsert
RawMaterialStockMovementListQuery
loadRawMaterialBatchForMutation()
loadRawMaterialStorageForMutation()
createRawMaterialStockMovementRecord()
findRawMaterialStockMovementRowById()
listRawMaterialStockMovementRows()
findRawMaterialProcessingConsumptionMovement()
```

## Phase 4B - Processing run repository and presenter split

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material-processing-run.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-processing-run.presenter.ts
artifacts/api-server/src/services/raw-material/raw-material-processing-run.dto.ts
artifacts/api-server/src/services/raw-material/raw-material-processing-run.service.ts
```

Goal:

```txt
Move processing run persistence and presentation details out of the orchestration service.
Keep processing status and quantity guards inside the service layer.
Keep route behavior unchanged.
```

Before this phase, `raw-material-processing-run.service.ts` owned:

```txt
permission checks
query where construction
run-number conflict lookup
input batch lookup
processing run lookup
Prisma create/update/cancel operations
status transition guard orchestration
output quantity guard orchestration
DTO mapping
```

After this phase:

```txt
raw-material-processing-run.repository.ts owns Prisma reads and writes.
raw-material-processing-run.presenter.ts owns DTO mapping.
raw-material-processing-run.dto.ts remains a compatibility re-export.
raw-material-processing-run.service.ts owns permission checks, validation, workflow guards, and orchestration.
```

Repository exports:

```txt
listRawMaterialProcessingRunRows()
findRawMaterialProcessingRunById()
findRawMaterialProcessingRunNumberConflict()
loadRawMaterialProcessingInputBatch()
createRawMaterialProcessingRunRecord()
updateRawMaterialProcessingRunRecord()
cancelRawMaterialProcessingRunRecord()
```

Presenter exports:

```txt
RawMaterialProcessingRunWithBatch
toRawMaterialProcessingRunDto()
```

## Phase 4C - Intake and batch repository/presenter split

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material-intake.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-intake.presenter.ts
artifacts/api-server/src/services/raw-material/raw-material-intake.dto.ts
artifacts/api-server/src/services/raw-material/raw-material-intake.service.ts
artifacts/api-server/src/services/raw-material/raw-material-batch.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-batch.presenter.ts
artifacts/api-server/src/services/raw-material/raw-material-batch.dto.ts
artifacts/api-server/src/services/raw-material/raw-material-batch.service.ts
```

Goal:

```txt
Move intake and batch persistence/presentation details out of their orchestration services.
Keep validation, quantity guards, and business invariant checks in the service layer.
Keep route behavior unchanged.
```

Before this phase, intake and batch services owned:

```txt
permission checks
query construction
reference/lot conflict lookups
supplier/storage/intake lookups
Prisma create/update/cancel operations
quantity balance guards
accepted-intake quantity guards
DTO mapping
```

After this phase:

```txt
raw-material-intake.repository.ts owns intake Prisma reads and writes.
raw-material-intake.presenter.ts owns intake DTO mapping.
raw-material-intake.dto.ts remains a compatibility re-export.
raw-material-intake.service.ts owns permission checks, validation, business guards, and orchestration.

raw-material-batch.repository.ts owns batch Prisma reads and writes.
raw-material-batch.presenter.ts owns batch DTO mapping.
raw-material-batch.dto.ts remains a compatibility re-export.
raw-material-batch.service.ts owns permission checks, validation, quantity guards, and orchestration.
```

Intake repository exports:

```txt
rawMaterialIntakeInclude
getRawMaterialIntakeWhere()
findRawMaterialIntakeById()
findRawMaterialIntakeReferenceConflict()
findActiveRawMaterialSupplier()
findActiveRawMaterialStorageLocation()
listRawMaterialIntakeRows()
createRawMaterialIntakeRecord()
updateRawMaterialIntakeRecord()
cancelRawMaterialIntakeRecord()
```

Batch repository exports:

```txt
getRawMaterialBatchInclude()
findRawMaterialBatchLotConflict()
loadRawMaterialIntakeForBatch()
loadRawMaterialStorageLocationForBatch()
sumActiveRawMaterialBatchQuantityForIntake()
listRawMaterialBatchRows()
createRawMaterialBatchRecord()
findRawMaterialBatchById()
updateRawMaterialBatchRecord()
deactivateRawMaterialBatchRecord()
```

## Behavior unchanged

These phases do not change:

```txt
route paths
request shapes
response shapes
Prisma schema
migrations
stock movement rules
processing workflow guards
permission matrix
frontend contract
```

## Why this order

Stock movement was split first because it mutates:

```txt
RawMaterialBatch.remainingQuantity
RawMaterialStorageLocation.usedKg
RawMaterialStockMovement ledger rows
```

Processing run was split second because stock consumption references processing runs and because processing has a status workflow:

```txt
PLANNED -> RUNNING -> COMPLETED
PLANNED/RUNNING -> CANCELLED
```

Intake and batch were split third because batch creation depends on intake accepted quantity and intake/batch traceability is central to Raw Material mode.

## Remaining Phase 4 work

Continue with:

```txt
Phase 4D - supplier/storage/pen service split
```

Suggested next files:

```txt
raw-material-supplier.repository.ts
raw-material-supplier.presenter.ts
raw-material-storage-location.repository.ts
raw-material-storage-location.presenter.ts
raw-material-pen.repository.ts
raw-material-pen.presenter.ts
raw-material-supplier.service.ts
raw-material-storage-location.service.ts
raw-material-pen.service.ts
```

## Validation command

Run locally:

```bash
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run typecheck
```

Focus on errors from:

```txt
src/services/raw-material/raw-material-intake.repository.ts
src/services/raw-material/raw-material-intake.presenter.ts
src/services/raw-material/raw-material-intake.service.ts
src/services/raw-material/raw-material-batch.repository.ts
src/services/raw-material/raw-material-batch.presenter.ts
src/services/raw-material/raw-material-batch.service.ts
```
