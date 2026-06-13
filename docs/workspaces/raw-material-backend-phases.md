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

Goal:

```txt
Replace ALL_ROLES guards with raw-material action permissions.
Keep route behavior the same.
Do not touch schema.
Do not touch migrations.
```

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

Role grouping:

```txt
VIEW_ROLES      = OWNER, MANAGER, ADMIN, OPERATOR, STAFF, VIEWER
OPERATE_ROLES   = OWNER, MANAGER, ADMIN, OPERATOR, STAFF
STOCK_ROLES     = OWNER, MANAGER, ADMIN, OPERATOR
APPROVAL_ROLES  = OWNER, MANAGER, ADMIN
```

## Phase 3 - Workflow guards and domain invariants

Status: next.

Goal:

```txt
Add domain guards for status changes and stock-sensitive actions.
Prevent illegal transitions and unsafe stock mutation.
```

Workflow areas:

```txt
intake quality status
batch quality status
processing status
kandang health status
stock movement type/reason/source
```

Guard examples:

```txt
Cannot create weighing for intake from another business.
Cannot create batch with accepted quantity greater than intake accepted quantity.
Cannot transfer more than batch remaining quantity.
Cannot consume more than available batch quantity.
Cannot complete processing if output quantities are invalid.
Cannot assign inactive batch as feed batch to active kandang pen.
```

Expected outputs:

```txt
raw-material.workflow.ts
raw-material.stock-rules.ts
transition/validation preview helpers
route/service integration
no migration unless a missing column is explicitly proven necessary
```

## Phase 4 - Service layer cleanup

Status: planned.

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

Existing services are already partially split per domain, so this phase should not blindly merge everything into one mega-service.

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

Summary fields:

```txt
supplier count
active supplier count
storage capacity / used / available
intake totals
accepted/rejected quantities
weighing net total
active batch count
batch remaining quantity
near-expiry batch count
processing run status distribution
kandang occupancy summary
stock movement counts by type/reason
latest activity
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

Start with Phase 3:

```txt
Workflow guards and domain invariants.
```
