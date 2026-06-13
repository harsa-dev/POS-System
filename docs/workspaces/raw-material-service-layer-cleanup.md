# Raw Material Service Layer Cleanup

Status: Phase 4 implemented.

This document records Phase 4 of the Raw Material backend plan.

Phase 4 was intentionally split into smaller subphases because Raw Material already has multiple production-backed service files. Rewriting every service boundary at once would be high risk and hard to validate.

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

After this phase:

```txt
raw-material-processing-run.repository.ts owns Prisma reads and writes.
raw-material-processing-run.presenter.ts owns DTO mapping.
raw-material-processing-run.dto.ts remains a compatibility re-export.
raw-material-processing-run.service.ts owns permission checks, validation, workflow guards, and orchestration.
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

## Phase 4D - Supplier, storage, and pen repository split

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material-supplier.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-supplier.service.ts
artifacts/api-server/src/services/raw-material/raw-material-storage-location.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-storage-location.service.ts
artifacts/api-server/src/services/raw-material/raw-material-pen.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-pen.service.ts
```

Goal:

```txt
Move supplier, storage location, and kandang pen persistence details out of their orchestration services.
Keep route behavior unchanged.
Keep validation and domain guards in services.
```

After this phase:

```txt
raw-material-supplier.repository.ts owns supplier Prisma reads and writes.
raw-material-supplier.service.ts owns permission checks, validation, conflict mapping, and orchestration.

raw-material-storage-location.repository.ts owns storage Prisma reads and writes.
raw-material-storage-location.service.ts owns permission checks, validation, storage capacity checks, conflict mapping, and orchestration.

raw-material-pen.repository.ts owns kandang pen raw SQL reads and writes.
raw-material-pen.service.ts owns permission checks, validation, feed batch guards, capacity guards, health guards, and orchestration.
```

Notes:

```txt
Supplier and storage still use their existing DTO mapper files.
Pen still uses its existing DTO mapper file.
Presenter extraction for these smaller surfaces can be done later only if it adds value.
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

Supplier, storage, and pen were split fourth because they are mostly reference/operational support surfaces. Pen was included here because its service still contained manual raw SQL persistence.

## Phase 4 completion

Phase 4 is complete for the planned Raw Material service cleanup pass.

Next phase:

```txt
Phase 5 - Audit integration
```
