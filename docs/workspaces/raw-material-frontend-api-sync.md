# Raw Material Frontend API Sync

Status: implemented.

This document records Phase 9 of the Raw Material backend/frontend phase plan.

## Goal

Synchronize the Raw Material frontend contract and workspace bridge with the backend APIs that now exist.

Keep mock fallback.
Do not enable unsafe write buttons.
Do not touch Prisma schema.
Do not touch migrations.
Do not change backend route behavior.
Do not update non-Raw-Material modes.

## Implemented files

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.types.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.mock-service.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-readonly-sections.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-placeholder-workspace.tsx
```

## API client

New file:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
```

Exports:

```txt
RawMaterialSummaryResponse
fetchRawMaterialSummary()
getRawMaterialSummaryErrorMessage()
createRawMaterialSummaryMetrics()
rawMaterialApiClient
```

Current API-first endpoint:

```txt
GET /raw-material/summary
```

The summary API is intentionally read-only.
It is used to populate top-level workspace metrics.

## Contract updates

Old frontend contract labels were stale:

```txt
/api/v3/raw-material/*
mock-only
future-db
```

Phase 9 updates them to current backend route names:

```txt
/raw-material/summary
/raw-material/intakes
/raw-material/weighings
/raw-material/batches
/raw-material/stock-movements/transfer
/raw-material/processing-runs
/raw-material/pens
/raw-material/suppliers
```

Persistence labels now support:

```txt
mock-only
future-db
backend-backed
backend-backed-with-mock-fallback
```

## Workspace behavior

The Raw Material workspace now tries to load:

```txt
GET /raw-material/summary
```

If it succeeds:

```txt
metrics source = api
metrics = backend summary metrics
readiness card shows API-backed state
```

If it fails:

```txt
metrics source = api-with-mock-fallback
metrics = existing mock metrics
workspace remains usable
error message is shown in readiness card
```

This keeps the workspace stable during local development when the API server is not running or the session is not authenticated.

## Readiness card

Readiness metadata now counts:

```txt
total contracts
backend-backed contracts
mock-only contracts
future-db contracts
```

Readiness label can now be:

```txt
preview-only
read-ready
write-planned
backend-ready
```

## Write buttons intentionally not enabled

Raw Material write endpoints exist on the backend, but Phase 9 does not enable direct frontend write buttons yet.

Reason:

```txt
stock transfer, adjustment, processing consumption, cancellation, and deactivate flows need explicit confirmation UX, loading state, error handling, and destructive action copy.
```

So the current workspace keeps preview forms local while exposing backend-backed contract metadata.

## Mock fallback retained

The following surfaces still use mock data for stable preview tables:

```txt
intake list table
batch traceability cards
storage snapshots
processing snapshots
kandang snapshots
supplier filter cards
scale profile dashboard
scale feature dashboard
```

This is intentional.
Phase 9 only introduces the API-first summary bridge and corrects frontend contract metadata.

## Validation

Run frontend typecheck/build from the frontend workspace if available:

```bash
pnpm --filter @workspace/pos-system run typecheck
pnpm --filter @workspace/pos-system run build
```

Run API typecheck for Raw Material if backend changes are nearby:

```bash
pnpm --filter @workspace/api-server run typecheck
```

Global non-Raw-Material errors remain out of scope.

## Next phase

Raw Material backend/frontend phase plan is complete through Phase 9.

Recommended next work should be a new lane, for example:

```txt
Raw Material frontend write UX hardening
Raw Material list API hydration
Raw Material shared dashboard API hydration
Global non-Raw-Material typecheck cleanup
```
