# Raw Material Backend Audit

This document is Phase 1 for Raw Material backend work.

It audits the current backend surface and compares it with the older frontend API contract. No code behavior, Prisma schema, migration, route handler, or stock mutation is changed in this phase.

## Phase status

```txt
Phase 1 - Baseline backend audit and route contract normalization
Status: implemented
```

## Current finding

Raw Material mode is no longer only a mock/frontend contract.

The backend already has registered Express routes, Prisma models, services, processing routes, kandang pen routes, and stock movement handlers.

Primary backend route files:

```txt
artifacts/api-server/src/routes/raw-material.ts
artifacts/api-server/src/routes/raw-material-processing.ts
artifacts/api-server/src/routes/raw-material-pens.ts
artifacts/api-server/src/routes/raw-material-stock-movements.ts
```

Primary service barrel:

```txt
artifacts/api-server/src/services/raw-material/index.ts
```

Primary Prisma areas:

```txt
RawMaterialSupplier
RawMaterialStorageLocation
RawMaterialIntake
RawMaterialWeighing
RawMaterialBatch
RawMaterialProcessingRun
RawMaterialKandangPen
RawMaterialStockMovement
```

## Contract mismatch

The frontend contract still describes paths in this shape:

```txt
/api/v3/raw-material/*
```

The current API server route handlers are registered under:

```txt
/raw-material/*
```

This does not mean the backend is missing. It means the frontend contract naming is stale and needs a sync phase.

## Route matrix

### Suppliers

| Method | Current route | Backend status | Notes |
| --- | --- | --- | --- |
| GET | `/raw-material/suppliers` | backend-backed | Lists suppliers with inactive/search filters. |
| POST | `/raw-material/suppliers` | backend-backed | Creates supplier. |
| PATCH | `/raw-material/suppliers/:id` | backend-backed | Updates supplier. |
| DELETE | `/raw-material/suppliers/:id` | backend-backed | Deactivates supplier, not hard delete. |

### Storage locations

| Method | Current route | Backend status | Notes |
| --- | --- | --- | --- |
| GET | `/raw-material/storage-locations` | backend-backed | Lists storage locations with inactive/search filters. |
| POST | `/raw-material/storage-locations` | backend-backed | Creates storage location. |
| PATCH | `/raw-material/storage-locations/:id` | backend-backed | Updates storage location. |
| DELETE | `/raw-material/storage-locations/:id` | backend-backed | Deactivates storage location. |

### Intakes

| Method | Current route | Backend status | Notes |
| --- | --- | --- | --- |
| GET | `/raw-material/intakes` | backend-backed | Supports status, supplier, target storage, and search filters. |
| POST | `/raw-material/intakes` | backend-backed | Creates intake. |
| PATCH | `/raw-material/intakes/:id` | backend-backed | Updates intake. |
| DELETE | `/raw-material/intakes/:id` | backend-backed | Cancels intake. |

### Weighings

| Method | Current route | Backend status | Notes |
| --- | --- | --- | --- |
| GET | `/raw-material/weighings` | backend-backed | Supports intake, station, operator, and search filters. |
| POST | `/raw-material/weighings` | backend-backed | Creates weighing. |
| PATCH | `/raw-material/weighings/:id` | backend-backed | Updates weighing. |
| DELETE | `/raw-material/weighings/:id` | backend-backed | Deletes weighing. |

### Batches

| Method | Current route | Backend status | Notes |
| --- | --- | --- | --- |
| GET | `/raw-material/batches` | backend-backed | Supports intake, storage, quality status, active state, and search filters. |
| POST | `/raw-material/batches` | backend-backed | Creates batch. |
| PATCH | `/raw-material/batches/:id` | backend-backed | Updates batch. |
| DELETE | `/raw-material/batches/:id` | backend-backed | Deactivates/quarantines batch. |

### Processing runs

| Method | Current route | Backend status | Notes |
| --- | --- | --- | --- |
| GET | `/raw-material/processing-runs` | backend-backed | Supports input batch, status, and search filters. |
| POST | `/raw-material/processing-runs` | backend-backed | Creates processing run. |
| PATCH | `/raw-material/processing-runs/:id` | backend-backed | Updates processing run. |
| POST | `/raw-material/processing-runs/:id/cancel` | backend-backed | Cancels processing run. |

### Kandang pens

| Method | Current route | Backend status | Notes |
| --- | --- | --- | --- |
| GET | `/raw-material/pens` | backend-backed | Supports feed batch, health status, active state, and search filters. |
| POST | `/raw-material/pens` | backend-backed | Creates kandang pen. |
| PATCH | `/raw-material/pens/:id` | backend-backed | Updates kandang pen. |
| DELETE | `/raw-material/pens/:id` | backend-backed | Deactivates kandang pen. |

### Stock movements

| Method | Current route | Backend status | Notes |
| --- | --- | --- | --- |
| GET | `/raw-material/stock-movements` | backend-backed | Lists ledger movements with batch/type/reason/source/storage/search filters. |
| POST | `/raw-material/stock-movements/adjust` | backend-backed | Adjusts batch stock. Needs Phase 8 hardening review. |
| POST | `/raw-material/stock-movements/transfer` | backend-backed | Transfers batch storage. Needs Phase 8 hardening review. |
| POST | `/raw-material/stock-movements/consume-processing` | backend-backed | Consumes stock for processing. Needs Phase 8 hardening review. |

## Backend status labels

```txt
backend-backed: route exists and calls backend service / Prisma-backed logic.
partial: backend exists but contract/status/guarding needs review.
contract-mismatch: frontend contract path/label no longer matches server reality.
mock-only: still frontend-only.
```

Current classification:

```txt
suppliers: backend-backed
storage locations: backend-backed
intakes: backend-backed
weighings: backend-backed
batches: backend-backed
processing runs: backend-backed
kandang pens: backend-backed
stock movements: backend-backed but needs hardening
frontend API contract: contract-mismatch
shared dashboard bridge: partial, should become API-first in Phase 6/9
```

## Permission status

Current route files mostly use:

```txt
requireRole(..., ALL_ROLES)
```

This means Phase 2 should replace broad role access with Raw Material action permissions.

No endpoint should be deleted during Phase 2. Only the guard should become more precise.

## Workflow and stock status

Current backend already performs real operations for stock movement surfaces, including:

```txt
adjust stock
transfer stock
consume stock for processing
```

Because these operations can change quantities, they must be reviewed before adding more automation.

Phase 3 and Phase 8 should harden these rules.

## Frontend contract update plan

Update `artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts` later, not in Phase 1.

Planned changes:

```txt
Change stale /api/v3/raw-material/* labels or explicitly document API gateway prefix behavior.
Change persistence labels from mock-only/future-db to backend-backed where applicable.
Add stock movement routes to the contract.
Add processing cancel route to the contract.
Mark destructive/deactivating actions clearly.
Keep mock fallback labels for workspace preview state.
```

## Recommended next phase

Proceed to Phase 2:

```txt
Permission hardening
```

Expected first implementation file:

```txt
artifacts/api-server/src/services/raw-material/raw-material.permissions.ts
```

Expected route changes:

```txt
Replace ALL_ROLES usage in raw-material routes with action-specific permission guards.
No schema change.
No migration.
No endpoint removal.
```
