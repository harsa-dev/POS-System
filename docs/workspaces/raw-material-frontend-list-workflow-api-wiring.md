# Raw Material Frontend List / Workflow API Wiring

Status: implemented.

This document records the Retail-style Raw Material Phase 5 implementation.

## Goal

Wire Raw Material frontend list and workflow read surfaces to backend APIs while keeping mock fallback available.

This phase formalizes the UI/API wiring that sits on top of the workflow read delegate.

## Implemented surfaces

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-placeholder-workspace.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-readonly-sections.tsx
```

## API-first workflow reads

The workspace loads backend read data through:

```txt
rawMaterialApiClient.getWorkflowReads()
```

The delegate fetches these endpoints in parallel:

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

## Mock fallback

If workflow read loading fails:

```txt
source = api-with-mock-fallback
workspace data falls back to rawMaterialMockService
UI remains usable
write actions remain disabled
```

Fallback intentionally remains in place for local preview, unauthenticated sessions, and backend-offline UI review.

## Contract metadata

The frontend API contract now includes read contracts for all workflow read endpoints:

```txt
rm-api-suppliers-list
rm-api-storage-list
rm-api-intake-list
rm-api-weighing-list
rm-api-batches-list
rm-api-processing-list
rm-api-kandang-list
rm-api-stock-movement-list
```

Read contracts use:

```txt
persistence = backend-backed-with-mock-fallback
```

Backend write route metadata is also present, but the frontend write UX is still intentionally disabled until preview/write delegates are implemented.

## UI surfaces hydrated from workflow reads

```txt
Supplier intake queue
Batch traceability
Weighing records
Storage capacity cards
Processing run cards
Kandang snapshot cards
Supplier filter preview
Stock movement trail
Transfer preview selectors
Processing preview selectors
```

## Backend enum normalization

The frontend API client maps backend enum casing into frontend display casing:

```txt
ACCEPTED   -> accepted
INSPECTION -> inspection
KG         -> kg
OPEN_YARD  -> Open Yard
PLANNED    -> planned
STABLE     -> stable
```

This keeps UI components stable while backend DTOs remain Prisma/API-oriented.

## Non-goals

Not included in this phase:

```txt
No write buttons enabled.
No preview endpoint added.
No generated OpenAPI client consolidation.
No Prisma schema change.
No migration.
No global non-Raw-Material cleanup.
```

## Validation

Run the scoped gate:

```bash
pnpm raw-material:check -- --no-smoke
```

Run the full scoped gate when backend smoke prerequisites are available:

```bash
pnpm raw-material:check
```

## Next phase

Proceed to:

```txt
Phase 6 - Raw Material OpenAPI/client coverage
```
