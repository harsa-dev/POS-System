# Raw Material Workflow Read Delegate

Status: implemented.

This document records the Retail-style Raw Material Phase 7C implementation.

## Goal

Hydrate Raw Material workflow/read screens from backend list endpoints while preserving mock fallback.

This phase intentionally does not enable write actions.

## Implemented files

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.types.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-placeholder-workspace.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-workspace.constants.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-workspace.utils.ts
```

## Backend endpoints consumed

```txt
GET /raw-material/suppliers
GET /raw-material/storage-locations
GET /raw-material/intakes
GET /raw-material/weighings
GET /raw-material/batches
GET /raw-material/processing-runs
GET /raw-material/pens
GET /raw-material/stock-movements
```

The summary endpoint remains separately handled:

```txt
GET /raw-material/summary
```

## API client additions

The Raw Material frontend API client now exposes:

```txt
getWorkflowReads()
listSuppliers()
listStorageLocations()
listIntakes()
listWeighings()
listBatches()
listProcessingRuns()
listKandangPens()
listStockMovements()
```

`getWorkflowReads()` loads all read delegates in parallel and returns:

```txt
RawMaterialWorkflowReadData
```

## Mapping behavior

Backend DTOs use Prisma-style enum casing such as:

```txt
ACCEPTED
INSPECTION
REJECTED
KG
DRY
OPEN_YARD
PLANNED
RUNNING
COMPLETED
CANCELLED
STABLE
MONITORING
CRITICAL
```

Frontend workspace components keep the existing display shape such as:

```txt
accepted
inspection
rejected
kg
Dry
Open Yard
planned
running
completed
cancelled
stable
monitoring
critical
```

The API client performs this mapping so the UI does not need to know Prisma enum casing.

## Workspace integration

The Raw Material placeholder workspace now keeps two independent API-first lanes:

```txt
summary metrics -> /raw-material/summary
workflow reads  -> /raw-material/* list endpoints
```

If workflow read loading succeeds:

```txt
source = api
lists use backend data
preview selectors use backend batch/storage IDs
stock movement trail shows backend ledger rows
```

If workflow read loading fails:

```txt
source = api-with-mock-fallback
lists use mock data
stock movement trail is empty
workspace remains usable
```

## UI surfaces affected

```txt
supplier intake queue
batch traceability
weighing records
storage capacity snapshot
processing runs snapshot
kandang snapshot
supplier filter preview
stock movement trail
preview storage transfer selectors
preview processing yield selectors
```

## Non-goals

```txt
Do not enable write buttons.
Do not create preview endpoints.
Do not generate OpenAPI client code.
Do not remove mock fallback.
Do not modify backend routes.
Do not touch Prisma schema or migrations.
Do not fix non-Raw-Material global errors.
```

## Validation

Run:

```bash
pnpm raw-material:check -- --no-smoke
```

For API smoke with a logged-in session cookie:

```bash
pnpm raw-material:smoke
```

## Next phase

Proceed to:

```txt
Raw Material Phase 5 - Frontend list/workflow API wiring
```

Phase 7C wires the read delegate and shared workspace list hydration.
Phase 5 should refine the per-module frontend API wiring and user-facing workflow states.
