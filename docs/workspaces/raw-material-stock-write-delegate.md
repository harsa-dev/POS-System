# Raw Material Stock Write Delegate

Status: implemented.

This document records Raw Material Phase 7E.

## Goal

Wire frontend stock write actions to the hardened backend stock movement endpoints.

The delegate is intentionally limited to stock movement operations that already have backend guards, audit logging, and ledger semantics.

## Implemented files

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material-stock-write.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-stock-write-actions.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-draft-forms.tsx
docs/workspaces/raw-material-stock-write-delegate.md
```

## Frontend write API client

File:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material-stock-write.api-client.ts
```

Exposed client:

```txt
rawMaterialStockWriteApiClient.adjustStock()
rawMaterialStockWriteApiClient.transferStock()
rawMaterialStockWriteApiClient.consumeForProcessing()
```

Endpoint mapping:

```txt
POST /raw-material/stock-movements/adjust
POST /raw-material/stock-movements/transfer
POST /raw-material/stock-movements/consume-processing
```

## Guarded UI component

File:

```txt
artifacts/pos-system/src/app/workspace/raw-material/raw-material-stock-write-actions.tsx
```

The component loads backend workflow reads before enabling write buttons.

Behavior:

```txt
source = api       -> stock write buttons are enabled
source = fallback  -> stock write buttons are disabled
source = loading   -> stock write buttons are disabled
```

This prevents mock IDs from being submitted to backend write endpoints.

## Mounted workspace surface

File:

```txt
artifacts/pos-system/src/app/workspace/raw-material/raw-material-draft-forms.tsx
```

`RawMaterialStockWriteActions` is mounted below the existing intake/weighing draft cards.

This keeps the workspace entrypoint stable while adding guarded write UX.

## Supported write actions

### Stock adjustment

Payload:

```txt
batchId
deltaQuantity
reason
note
```

Allowed frontend reasons:

```txt
STOCK_COUNT
CORRECTION
MANUAL_ADJUSTMENT
```

The backend still enforces:

```txt
positive movement quantity
manual adjustment note
manual adjustment reason
remaining quantity range
storage usage range
ledger semantics
audit log write
```

### Stock transfer

Payload:

```txt
batchId
targetStorageLocationId
note?
```

The frontend does not submit mock IDs. It only enables transfer when backend workflow data is loaded.

The backend transfers the whole remaining batch, updates storage usage, writes transfer-out and transfer-in ledger rows, and writes audit.

### Processing consumption

Payload:

```txt
processingRunId
note?
```

The backend consumes the processing run input quantity, rejects duplicate consumption, updates batch/storage, writes ledger, and writes audit.

## Contract metadata

File:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
```

New/updated contract entries:

```txt
rawMaterialAdjustStock
rawMaterialTransferStock
rawMaterialConsumeProcessingStock
```

The frontend contract now marks these stock write endpoints as wired backend-backed operations.

## Non-goals

This phase does not implement:

```txt
intake create write UX
weighing create write UX
batch create write UX
processing run create write UX
status transition frontend actions
stock reversal workflows
generated API client replacement
Prisma schema changes
migration changes
non-Raw-Material typecheck cleanup
```

## Validation

Run scoped Raw Material validation:

```bash
pnpm raw-material:check -- --no-smoke
```

Run full scoped gate:

```bash
pnpm raw-material:check
```

## Next phase

Proceed to:

```txt
Raw Material Phase 7F - Guarded workflow status delegate
```
