# Raw Material OpenAPI and Client Coverage

Status: implemented.

This document records Raw Material Retail-style Phase 6.

## Goal

Add Raw Material endpoint coverage to the shared OpenAPI spec and link frontend API contract metadata to OpenAPI operation IDs.

This phase does not replace the existing handwritten Raw Material API client.
Generated client consolidation remains a later phase.

## Implemented files

```txt
lib/api-spec/openapi.yaml
artifacts/pos-system/src/features/raw-material/core-system/raw-material.types.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
docs/workspaces/raw-material-openapi-client-coverage.md
```

## OpenAPI coverage

The shared OpenAPI spec now includes the `raw-material` tag and the currently active Raw Material routes.

Read endpoints:

```txt
GET /raw-material/summary
GET /raw-material/suppliers
GET /raw-material/storage-locations
GET /raw-material/intakes
GET /raw-material/weighings
GET /raw-material/batches
GET /raw-material/processing-runs
GET /raw-material/pens
GET /raw-material/stock-movements
```

Write endpoints covered for contract visibility:

```txt
POST /raw-material/suppliers
POST /raw-material/storage-locations
POST /raw-material/intakes
POST /raw-material/weighings
POST /raw-material/batches
POST /raw-material/processing-runs
POST /raw-material/processing-runs/{id}/cancel
POST /raw-material/pens
POST /raw-material/stock-movements/adjust
POST /raw-material/stock-movements/transfer
POST /raw-material/stock-movements/consume-processing
```

## Operation IDs

The frontend API contract metadata now stores an `operationId` for each contract entry.

Current read operation IDs:

```txt
rawMaterialGetSummary
rawMaterialListSuppliers
rawMaterialListStorageLocations
rawMaterialListIntakes
rawMaterialListWeighings
rawMaterialListBatches
rawMaterialListProcessingRuns
rawMaterialListPens
rawMaterialListStockMovements
```

Current write operation IDs present in frontend metadata:

```txt
rawMaterialCreateIntake
rawMaterialCreateWeighing
rawMaterialTransferStock
rawMaterialCreateProcessingRun
```

Additional write operation IDs are documented in OpenAPI for later client consolidation and UX wiring.

## Schema strategy

Raw Material OpenAPI schemas currently use generic response wrappers:

```txt
RawMaterialObject
RawMaterialArray
RawMaterialObjectResponse
RawMaterialArrayResponse
```

This mirrors the existing Retail OpenAPI style in the repository, where many responses are intentionally broad during contract consolidation.

Exact DTO schema expansion is reserved for a later generated-client consolidation phase.

## Client coverage boundary

The existing frontend Raw Material API client remains handwritten for now:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
```

It already covers:

```txt
summary metrics
workflow read delegates
mock fallback
backend enum casing normalization
```

This phase links frontend contract metadata to OpenAPI operation IDs so the future generated client consolidation can map operations without guessing.

## Non-goals

```txt
No generated client replacement yet.
No write button enablement.
No preview endpoint creation.
No Prisma schema change.
No migration.
No backend route behavior change.
No global non-Raw-Material cleanup.
```

## Validation

Run the Raw Material scoped gate:

```bash
pnpm raw-material:check -- --no-smoke
```

If API server and session cookie are available:

```bash
pnpm raw-material:check
```

## Next phase

Proceed to:

```txt
Raw Material Phase 7D - Intake/batch/processing preview delegate
```
