# Raw Material Stock Mutation Hardening

Status: implemented.

This document records Phase 8 of the Raw Material backend phase plan.

## Goal

Harden Raw Material stock mutation rules without changing schema, migrations, route paths, or frontend contracts.

Covered mutation paths:

```txt
adjustRawMaterialBatchStock()
transferRawMaterialBatchStorage()
consumeRawMaterialForProcessingRun()
```

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material.stock-rules.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
```

## Added hardening rules

### 1. Finite quantity guards

`assertRawMaterialQuantityRange()` and `assertRawMaterialStorageUsage()` now validate finite numeric values before checking ranges.

This prevents `NaN`, `Infinity`, and invalid computed values from slipping through stock mutation logic.

### 2. Storage containment guard

New helper:

```txt
assertRawMaterialStorageContainsQuantity()
```

Used before stock-reducing operations:

```txt
negative adjustment
transfer out from source storage
processing consumption
```

This protects `RawMaterialStorageLocation.usedKg` from being reduced below what the storage actually contains.

### 3. Manual adjustment reason guard

New helper:

```txt
assertRawMaterialManualAdjustmentReason()
```

Manual stock adjustment now rejects operational reasons that should not be used from the adjustment endpoint:

```txt
PURCHASE
RECEIVING
TRANSFER_IN
TRANSFER_OUT
PRODUCTION_USAGE
```

Manual/correction note requirements still apply through:

```txt
assertRawMaterialManualAdjustmentNote()
```

### 4. Ledger semantics guard

New helper:

```txt
assertRawMaterialStockMovementLedger()
```

This validates stock movement rows before they are inserted into the ledger.

#### Adjustment / correction

Rules:

```txt
quantity must match abs(afterQuantity - beforeQuantity)
source must be MANUAL, STOCK_COUNT, or SYSTEM
sourceStorageLocationId and targetStorageLocationId are required
source and target storage must be the same
```

#### Transfer in/out

Rules:

```txt
type and reason must match TRANSFER_IN / TRANSFER_OUT
source must be TRANSFER
source and target storage are both required
source and target storage must be different
batch remaining quantity must not change
```

#### Production usage

Rules:

```txt
type and reason must be PRODUCTION_USAGE
source must be PROCESSING_RUN
sourceId must reference the processing run
source storage is required
target storage must be empty
quantity must match beforeQuantity - afterQuantity
quantity must reduce batch remaining quantity
```

## Service integration

### Adjustment

Before mutation:

```txt
validate input
assert manage role
assert manual adjustment reason
assert manual/correction note when required
assert movement quantity
load active KG batch
assert next remaining quantity range
if reducing stock, assert storage contains the adjusted quantity
assert next storage usage
assert ledger semantics
```

Then mutation runs inside the existing transaction:

```txt
update RawMaterialBatch.remainingQuantity
update RawMaterialStorageLocation.usedKg
insert RawMaterialStockMovement
write AuditLog
return movement DTO
```

### Transfer

Before mutation:

```txt
validate input
assert manage role
load active KG batch
load active target storage
assert source and target are different
assert transfer quantity
assert source storage contains transfer quantity
assert source/target storage usage
assert TRANSFER_OUT ledger semantics
assert TRANSFER_IN ledger semantics
```

Then mutation runs inside the existing transaction:

```txt
update source storage usedKg
update target storage usedKg
update batch storageLocationId
insert TRANSFER_OUT movement
insert TRANSFER_IN movement
write AuditLog
return TRANSFER_OUT DTO
```

### Processing consumption

Before mutation:

```txt
validate input
assert manage role
reject duplicate consumption for processing run
load processing run and input batch
assert processing status can consume stock
assert active KG input batch
assert input quantity <= batch remaining quantity
assert next remaining quantity range
assert storage contains input quantity
assert next storage usage
assert movement quantity
assert PRODUCTION_USAGE ledger semantics
```

Then mutation runs inside the existing transaction:

```txt
update RawMaterialBatch.remainingQuantity
update RawMaterialStorageLocation.usedKg
insert PRODUCTION_USAGE movement
write AuditLog
return movement DTO
```

## Non-goals

This phase intentionally does not:

```txt
change Prisma schema
add migrations
change route paths
change frontend API contract
rewrite stock movement repository
fix non-raw-material typecheck errors
```

## Validation command

```bash
pnpm --filter @workspace/api-server run typecheck
```

Expected scope:

```txt
No errors from src/services/raw-material/*
No errors from src/routes/raw-material*
```

Non-raw-material errors remain out of scope for this phase.

## Next phase

Proceed to Phase 9:

```txt
Frontend API sync.
```
