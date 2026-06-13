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

Implemented output:

```txt
docs/workspaces/raw-material-backend-phases.md
```

Important correction:

```txt
docs/06-raw-material-mode.md is now partially stale.
It still says mock-only / no Prisma / no migration.
The current main branch already contains Raw Material Prisma models, migrations, routes, services, and stock movement handlers.
```

## Phase 1 - Baseline backend audit and route contract normalization

Status: implemented.

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
artifacts/api-server/src/services/raw-material/raw-material-processing-run.service.ts
artifacts/api-server/src/services/raw-material/raw-material-pen.service.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.service.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.types.ts
artifacts/api-server/src/services/raw-material/raw-material-stock-movement.validation.ts
artifacts/api-server/src/services/raw-material/index.ts
docs/workspaces/raw-material-workflow-guards.md
```

Covered workflow areas:

```txt
processing status transitions
processing output/input invariants
stock adjustment guards
stock transfer guards
processing stock consumption guards
kandang occupancy/capacity guards
kandang feed batch guards
stock movement enum alignment with Prisma schema
```

Important stock enum correction:

```txt
Old service literals: TRANSFER, PROCESSING_USAGE
Prisma enum literals: TRANSFER_IN, TRANSFER_OUT, PRODUCTION_USAGE
```

No Prisma schema or migration was changed in this phase.

## Phase 4 - Service layer cleanup

Status: next.

Goal:

```txt
Split large service files into repository/service/presenter/validator boundaries where needed.
Keep route behavior stable.
```

Target pattern:

```txt
raw-material.types.ts
raw-material.permissions.ts
raw-material.repository.ts
raw-material.workflow.ts
raw-material.presenter.ts
raw-material.audit.ts
```

Priority order:

```txt
stock movement service
processing run service
intake and batch service
supplier/storage/pens service
```

## Phase 5 - Audit integration

Status: planned.

Goal:

```txt
Mirror important raw material mutations into global AuditLog.
Keep existing raw material stock movement ledger as operational history.
Use AuditLog for governance-level changes.
```

Audit candidates:

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

Status: planned.

Goal:

```txt
Expose a backend summary endpoint for Raw Material shared dashboards.
Stop relying only on frontend mock/shared adapters where backend data exists.
```

Suggested endpoint:

```txt
GET /api/raw-material/summary
```

## Phase 7 - Prisma delegate and typecheck cleanup

Status: planned.

Goal:

```txt
Make Raw Material backend compile cleanly against generated Prisma types.
Fix known type errors in raw-material route/service exports.
Do not hide errors with any or ts-ignore.
```

Known current issues from local validation:

```txt
src/routes/raw-material-pens.ts imports RawMaterialPenHealthStatus from services/raw-material/index.js,
but the barrel may not export that type.

src/routes/raw-material.ts passes query.qualityStatus as string | undefined,
but listRawMaterialBatches expects RawMaterialBatchQualityStatus | undefined.
```

## Phase 8 - Stock mutation hardening

Status: planned.

Goal:

```txt
Treat stock movement as a guarded ledger operation.
Make adjustment, transfer, and processing consumption safe, scoped, and auditable.
```

Rules:

```txt
All stock movement must be business-scoped.
All movements must record beforeQuantity and afterQuantity.
All reductions must reject negative afterQuantity.
All processing consumption must reference a valid processing run and batch.
Transfers must update source/target storage usage consistently.
Manual adjustment must require reason/note depending on direction.
```

## Phase 9 - Frontend API sync

Status: planned.

Goal:

```txt
Update frontend raw-material API contract and workspace bridge to match real backend capabilities.
Keep mock fallback for unauthenticated/dev preview states.
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

Start with Phase 4:

```txt
Service layer cleanup.
```
