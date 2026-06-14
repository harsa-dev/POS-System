# Raw Material Generated API Client Consolidation

Status: implemented.

## Goal

Phase 8E consolidates Raw Material frontend API calls behind an operation-driven generated-client boundary.

This phase does not introduce a full OpenAPI code generation pipeline. The repository does not currently have a generated client command for Raw Material, so this phase adds a stable generated-client facade that maps OpenAPI-style `operationId` values to method/path metadata and centralizes request execution.

## Implemented files

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.generated-api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material-preview.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material-stock-write.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material-workflow-status.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
docs/workspaces/raw-material-generated-client-consolidation.md
```

## Generated client boundary

New file:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.generated-api-client.ts
```

It exports:

```txt
RAW_MATERIAL_GENERATED_API_OPERATIONS
RawMaterialGeneratedApiOperationId
RawMaterialGeneratedApiRequestOptions
getRawMaterialGeneratedApiOperation()
resolveRawMaterialGeneratedApiPath()
rawMaterialGeneratedApiRequest()
rawMaterialGeneratedApiData()
```

## Operation registry

The operation registry maps operation IDs to HTTP method and path:

```txt
rawMaterialGetSummary                  -> GET  /raw-material/summary
rawMaterialListSuppliers               -> GET  /raw-material/suppliers
rawMaterialListStorageLocations        -> GET  /raw-material/storage-locations
rawMaterialListIntakes                 -> GET  /raw-material/intakes
rawMaterialListWeighings               -> GET  /raw-material/weighings
rawMaterialListBatches                 -> GET  /raw-material/batches
rawMaterialListProcessingRuns          -> GET  /raw-material/processing-runs
rawMaterialListPens                    -> GET  /raw-material/pens
rawMaterialListStockMovements          -> GET  /raw-material/stock-movements

rawMaterialPreviewIntake               -> POST /raw-material/previews/intake
rawMaterialPreviewBatch                -> POST /raw-material/previews/batch
rawMaterialPreviewProcessingRun        -> POST /raw-material/previews/processing-run

rawMaterialAdjustStock                 -> POST /raw-material/stock-movements/adjust
rawMaterialReverseStockAdjustment      -> POST /raw-material/stock-movements/{id}/reverse-adjustment
rawMaterialTransferStock               -> POST /raw-material/stock-movements/transfer
rawMaterialConsumeProcessingStock      -> POST /raw-material/stock-movements/consume-processing

rawMaterialSetIntakeStatus             -> POST /raw-material/status/intakes/{id}
rawMaterialSetBatchStatus              -> POST /raw-material/status/batches/{id}
rawMaterialSetProcessingWorkflowStatus -> POST /raw-material/status/processing-runs/{id}
rawMaterialSetPenWorkflowStatus        -> POST /raw-material/status/pens/{id}
```

Compatibility operations remain represented for legacy paths, but current frontend status delegates route through the Phase 8A status family.

## Consolidated clients

The following clients now route through `rawMaterialGeneratedApiData()`:

```txt
raw-material.api-client.ts
raw-material-preview.api-client.ts
raw-material-stock-write.api-client.ts
raw-material-workflow-status.api-client.ts
```

The UI-level code keeps importing the domain clients. The generated boundary is internal to the Raw Material core-system layer.

## Why this approach

A real generated client should eventually be produced from `lib/api-spec/openapi.yaml`. Until that pipeline exists, this facade keeps operation IDs, method/path metadata, path parameter interpolation, query handling, signal handling, JSON body handling, and envelope unwrapping in one place.

This reduces hard-coded route strings across Raw Material client modules without forcing the whole POS app to adopt a codegen pipeline immediately.

## Non-goals

```txt
No full OpenAPI code generation command.
No DTO schema expansion.
No backend route behavior change.
No Prisma schema change.
No migration.
No removal of compatibility backend routes.
No global non-Raw-Material cleanup.
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
Phase 8G - Migration baseline/idempotency hardening
```
