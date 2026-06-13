# Raw Material Service Layer Cleanup

Status: Phase 4A implemented.

This document records Phase 4 of the Raw Material backend plan.

Phase 4 is intentionally split into smaller subphases because Raw Material already has multiple production-backed service files. Rewriting every service boundary at once would be high risk and hard to validate.

## Phase 4A - Stock movement repository split

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
```

## Goal

Move stock movement persistence details out of the orchestration service.

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

## Repository responsibilities

New repository file:

```txt
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.repository.ts
```

Exports:

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

Persistence moved out of the service:

```txt
INSERT INTO RawMaterialStockMovement
SELECT stock movement rows with batch/storage labels
load batch with storage location
load active storage location
find duplicate processing consumption movement
```

## Service responsibilities after split

`raw-material-stock-movement.service.ts` now focuses on:

```txt
role assertion
input validation
stock/domain guard application
transaction orchestration
batch/storage not-found error mapping
DTO mapping
```

The service still controls business behavior.
The repository only exposes persistence operations.

## Behavior unchanged

This phase does not change:

```txt
route paths
request shapes
response shapes
Prisma schema
migrations
stock movement rules
permission matrix
frontend contract
```

## Why stock movement first

Stock movement is the highest-risk Raw Material service because it mutates:

```txt
RawMaterialBatch.remainingQuantity
RawMaterialStorageLocation.usedKg
RawMaterialStockMovement ledger rows
```

Splitting it first makes later stock mutation hardening easier.

## Remaining Phase 4 work

Phase 4B should split processing run persistence and presentation boundaries.

Suggested next files:

```txt
raw-material-processing-run.repository.ts
raw-material-processing-run.presenter.ts
raw-material-processing-run.service.ts
```

Then continue with:

```txt
Phase 4C - intake and batch service split
Phase 4D - supplier/storage/pen service split
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
src/services/raw-material/raw-material-stock-movement.repository.ts
src/services/raw-material/raw-material-stock-movement.service.ts
```
