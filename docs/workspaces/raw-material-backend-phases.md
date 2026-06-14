# Raw Material Backend Phases

This document defines the backend phase plan for Raw Material mode.

It follows the same phase discipline used for Custom Business / Service mode, but the scope is different because Raw Material already has active Prisma models, migrations, Express routes, backend services, stock movement logic, processing routes, kandang pen routes, and shared dashboard bridge code.

## Current baseline

Raw Material mode is no longer only a frontend mock workspace.

Existing backend surfaces:

```txt
artifacts/api-server/src/routes/raw-material.ts
artifacts/api-server/src/routes/raw-material-processing.ts
artifacts/api-server/src/routes/raw-material-pens.ts
artifacts/api-server/src/routes/raw-material-stock-movements.ts
artifacts/api-server/src/services/raw-material/
artifacts/api-server/prisma/schema.prisma
```

Existing frontend / shared surfaces:

```txt
artifacts/pos-system/src/app/workspace/raw-material/
artifacts/pos-system/src/features/raw-material/core-system/
artifacts/pos-system/src/features/shared/raw-material-bridge/
```

Known modules:

```txt
suppliers
storage locations
intakes
weighings
batches
processing runs
kandang pens
stock movements
shared dashboard bridge
```

## Phase 0 - Documentation alignment

Status: implemented.

Goal:

```txt
Bring docs in line with actual repository state.
Stop treating Raw Material mode as mock-only when backend code and Prisma models already exist.
Define the implementation phases before adding more logic.
```

Important correction:

```txt
docs/06-raw-material-mode.md is now partially stale.
It still says mock-only / no Prisma / no migration.
The current main branch already contains Raw Material Prisma models, migrations, routes, services, and stock movement handlers.
```

No code behavior was changed in this phase.

## Phase 1 - Baseline backend audit and route contract normalization

Status: implemented.

Goal:

```txt
Audit existing route behavior.
Normalize response shape.
Normalize endpoint naming between frontend API contract and API server.
Document what is already production-backed versus still preview-only.
```

Implemented output:

```txt
docs/workspaces/raw-material-backend-audit.md
```

Current mismatch to review later:

```txt
Frontend contract uses /api/v3/raw-material/*.
API server currently registers /raw-material/* under the API router.
Some frontend contract entries still mark mock-only/future-db.
Backend already persists data for many of those surfaces.
```

## Phase 2 - Permission hardening

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material.permissions.ts
artifacts/api-server/src/routes/raw-material.ts
artifacts/api-server/src/routes/raw-material-processing.ts
artifacts/api-server/src/routes/raw-material-pens.ts
artifacts/api-server/src/routes/raw-material-stock-movements.ts
docs/workspaces/raw-material-permission-hardening.md
```

Implemented permission keys:

```txt
raw-material.view
raw-material.supplier.manage
raw-material.storage.manage
raw-material.intake.create
raw-material.intake.update
raw-material.weighing.record
raw-material.batch.manage
raw-material.processing.manage
raw-material.kandang.manage
raw-material.stock.adjust
raw-material.stock.transfer
raw-material.stock.consume
```

## Phase 3 - Workflow guards and domain invariants

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material.workflow.ts
artifacts/api-server/src/services/raw-material/raw-material.stock-rules.ts
docs/workspaces/raw-material-workflow-guards.md
```

Guarded areas:

```txt
intake quality status
batch quality status
processing status
kandang health status
stock movement type/reason/source
```

## Phase 4 - Service layer cleanup

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-processing-run.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-processing-run.presenter.ts
artifacts/api-server/src/services/raw-material/raw-material-intake.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-intake.presenter.ts
artifacts/api-server/src/services/raw-material/raw-material-batch.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-batch.presenter.ts
artifacts/api-server/src/services/raw-material/raw-material-supplier.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-storage-location.repository.ts
artifacts/api-server/src/services/raw-material/raw-material-pen.repository.ts
docs/workspaces/raw-material-service-layer-cleanup.md
```

Phase 4 slices:

```txt
Phase 4A - stock movement repository split
Phase 4B - processing run repository/presenter split
Phase 4C - intake and batch repository/presenter split
Phase 4D - supplier/storage/pen repository split
```

## Phase 5 - Audit integration

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material.audit.ts
docs/workspaces/raw-material-audit-integration.md
```

Audited mutations:

```txt
supplier create/update/deactivate
storage create/update/deactivate
intake create/update/cancel
weighing create/update/delete
batch create/update/deactivate
processing run create/update/cancel
pen create/update/deactivate
stock adjustment
stock transfer
processing consumption
```

## Phase 6 - Shared dashboard backend summary

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material.summary.ts
artifacts/api-server/src/routes/raw-material-summary.ts
artifacts/api-server/src/routes/index.ts
docs/workspaces/raw-material-shared-dashboard-summary.md
```

Implemented endpoint:

```txt
GET /raw-material/summary
```

Summary sections:

```txt
business
suppliers
storage
intakes
weighings
batches
processing
kandang
stockMovements
latestActivity
```

No Prisma schema, migration, stock mutation, route contract, or frontend contract was changed in this phase.

## Phase 7 - Prisma delegate and typecheck cleanup

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/index.ts
docs/workspaces/raw-material-typecheck-cleanup.md
```

Goal:

```txt
Confirm the Raw Material backend lane compiles cleanly against generated Prisma types.
Keep global non-Raw-Material typecheck errors out of scope until their own cleanup lane.
```

Resolved Raw Material typecheck issues:

```txt
raw-material-pens.ts type import mismatch
raw-material.ts batch qualityStatus query mismatch
raw-material.audit.ts audit client cast mismatch
```

No Prisma schema, migration, route behavior, or frontend contract was changed in this phase.

## Phase 8 - Stock mutation hardening

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material.stock-rules.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
docs/workspaces/raw-material-stock-mutation-hardening.md
```

Goal:

```txt
Treat stock movement as a guarded ledger operation.
Make adjustment, transfer, and processing consumption safe, scoped, and auditable.
```

Implemented hardening:

```txt
finite quantity guards
storage containment guard
manual adjustment reason guard
ledger semantics guard
adjustment source/target storage alignment
transfer type/reason/source/storage alignment
production usage processing-run source alignment
source storage quantity check before reductions
```

No Prisma schema, migration, route path, frontend contract, or non-Raw-Material file was changed in this phase.

## Phase 9 - Frontend API sync

Status: next.

Goal:

```txt
Update frontend raw-material API contract and workspace bridge to match real backend capabilities.
Keep mock fallback for unauthenticated/dev preview states.
```

Expected outputs:

```txt
raw-material API client
API-first bridge
contract persistence labels updated
workspace action buttons wired only when safe
mock fallback retained
```

## Non-goals

Do not do these unless a later phase explicitly approves it:

```txt
Do not redesign raw material schema from scratch.
Do not remove existing routes.
Do not delete frontend mock data.
Do not merge raw material stock with restaurant inventory stock.
Do not unlock unrelated business modes.
Do not change restaurant/service-business workflows while doing raw material work.
```

## Current recommended next action

Start with Phase 9:

```txt
Frontend API sync.
```
