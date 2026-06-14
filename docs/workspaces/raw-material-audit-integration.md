# Raw Material Audit Integration

Status: implemented.

This document records Phase 5 of the Raw Material backend phase plan.

## Goal

Mirror important Raw Material mutations into the global `AuditLog` table.

No Prisma schema change.
No migration.
No route path change.
No frontend contract change.

## Audit helper

Implemented file:

```txt
artifacts/api-server/src/services/raw-material/raw-material.audit.ts
```

Exports:

```txt
RawMaterialAuditAction
RawMaterialAuditInput
toRawMaterialAuditChanges()
writeRawMaterialAuditLog()
```

The helper writes:

```txt
businessId
userId
action
entityType
entityId
changes
```

`changes` is normalized through JSON serialization so Date values become safe ISO strings before Prisma writes to the `Json` column.

## Audited service mutations

### Supplier

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-supplier.service.ts
```

Audited actions:

```txt
createRawMaterialSupplier        -> CREATE RawMaterialSupplier
updateRawMaterialSupplier        -> UPDATE RawMaterialSupplier
deactivateRawMaterialSupplier    -> DELETE RawMaterialSupplier
```

### Storage location

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-storage-location.service.ts
```

Audited actions:

```txt
createRawMaterialStorageLocation      -> CREATE RawMaterialStorageLocation
updateRawMaterialStorageLocation      -> UPDATE RawMaterialStorageLocation
deactivateRawMaterialStorageLocation  -> DELETE RawMaterialStorageLocation
```

### Intake

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-intake.service.ts
```

Audited actions:

```txt
createRawMaterialIntake   -> CREATE RawMaterialIntake
updateRawMaterialIntake   -> UPDATE RawMaterialIntake
cancelRawMaterialIntake   -> DELETE RawMaterialIntake
```

### Batch

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-batch.service.ts
```

Audited actions:

```txt
createRawMaterialBatch      -> CREATE RawMaterialBatch
updateRawMaterialBatch      -> UPDATE RawMaterialBatch
deactivateRawMaterialBatch  -> DELETE RawMaterialBatch
```

### Processing run

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-processing-run.service.ts
```

Audited actions:

```txt
createRawMaterialProcessingRun   -> CREATE RawMaterialProcessingRun
updateRawMaterialProcessingRun   -> UPDATE RawMaterialProcessingRun
cancelRawMaterialProcessingRun   -> DELETE RawMaterialProcessingRun
```

### Kandang pen

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-pen.service.ts
```

Audited actions:

```txt
createRawMaterialPen      -> CREATE RawMaterialKandangPen
updateRawMaterialPen      -> UPDATE RawMaterialKandangPen
deactivateRawMaterialPen  -> DELETE RawMaterialKandangPen
```

### Stock movement

File:

```txt
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
```

Audited actions:

```txt
adjustRawMaterialBatchStock          -> CREATE RawMaterialStockMovement
transferRawMaterialBatchStorage      -> CREATE RawMaterialStockMovement
consumeRawMaterialForProcessingRun   -> CREATE RawMaterialStockMovement
```

Stock movement audits are written inside the same Prisma transaction as the stock mutation and ledger row creation.

## Audit payload shape

Create actions usually include:

```txt
payload
result
```

Update actions usually include:

```txt
before
payload
result
```

Deactivate/cancel actions usually include:

```txt
before
result
```

Stock movement audit payloads include operation-specific before/after quantities and storage usage values.

## Non-goals

This phase does not:

```txt
add a new audit table
change AuditLog schema
change stock movement ledger semantics
change route response contracts
change frontend display
change non-raw-material audit behavior
```

## Next phase

Proceed to Phase 6:

```txt
Shared dashboard backend summary.
```
