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

No code behavior is changed in this phase.

## Phase 1 - Baseline backend audit and route contract normalization

Status: implemented.

Phase output:

```txt
docs/workspaces/raw-material-backend-audit.md
```

Goal:

```txt
Audit existing route behavior.
Normalize response shape.
Normalize endpoint naming between frontend API contract and API server.
Document what is already production-backed versus still preview-only.
```

Current mismatch reviewed:

```txt
Frontend contract uses /api/v3/raw-material/*.
API server currently registers /raw-material/* under the API router.
Some frontend contract entries still mark mock-only/future-db.
Backend already persists data for many of those surfaces.
```

Implemented outputs:

```txt
route matrix
backend-backed/partial/contract-mismatch labels
frontend contract update plan
no migration
no schema change
```

Audited route groups:

```txt
GET/POST/PATCH/DELETE suppliers
GET/POST/PATCH/DELETE storage-locations
GET/POST/PATCH/DELETE intakes
GET/POST/PATCH/DELETE weighings
GET/POST/PATCH/DELETE batches
GET/POST/PATCH/CANCEL processing-runs
GET/POST/PATCH/DELETE pens
GET stock-movements
POST stock-movements/adjust
POST stock-movements/transfer
POST stock-movements/consume-processing
```

## Phase 2 - Permission hardening

Status: next.

Goal:

```txt
Replace ALL_ROLES guards with raw-material action permissions.
Keep route behavior the same.
Do not touch schema.
Do not touch migrations.
```

Suggested permission keys:

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

Suggested role grouping:

```txt
VIEW_ROLES      = OWNER, MANAGER, ADMIN, OPERATOR, STAFF, VIEWER
OPERATE_ROLES   = OWNER, MANAGER, ADMIN, OPERATOR, STAFF
STOCK_ROLES     = OWNER, MANAGER, ADMIN, OPERATOR
APPROVAL_ROLES  = OWNER, MANAGER, ADMIN
```

Expected outputs:

```txt
raw-material.permissions.ts
route guard replacement
permission matrix docs
no migration
```

## Phase 3 - Workflow guards and domain invariants

Status: planned.

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

Expected outputs:

```txt
thin routes
repositories own Prisma access
services own orchestration
presenters own response shape
validators own request parsing
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

Expected outputs:

```txt
raw-material.audit.ts
audit helper integration in routes/services
changes JSON shape per action
no migration
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

Expected outputs:

```txt
raw-material.summary.ts
summary route
frontend bridge API-first fallback
shared dashboard relevance policy update if needed
no migration
```

## Phase 7 - Prisma delegate and typecheck cleanup

Status: planned.

Goal:

```txt
Make Raw Material backend compile cleanly against generated Prisma types.
Fix known type errors in raw-material route/service exports.
Do not hide errors with any or ts-ignore.
```

Known current issue from local validation:

```txt
src/routes/raw-material-pens.ts imports RawMaterialPenHealthStatus from services/raw-material/index.js,
but the barrel may not export that type.
```

Additional typecheck item:

```txt
src/routes/raw-material.ts passes query.qualityStatus as string | undefined,
but listRawMaterialBatches expects RawMaterialBatchQualityStatus | undefined.
```

Expected outputs:

```txt
barrel export fix
query enum parser helpers
Prisma generated type alignment
pnpm --filter @workspace/api-server run generate passes
pnpm --filter @workspace/api-server run build passes
service/raw-material typecheck errors cleared
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

Expected outputs:

```txt
raw-material-stock-rules.ts
stock transaction wrappers
ledger presenter
summary integration
possibly no migration if current tables are sufficient
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

Proceed to Phase 2:

```txt
Permission hardening.
Create raw-material.permissions.ts.
Replace ALL_ROLES usage in raw-material routes with action-specific permission guards.
Do not change schema or migrations.
```
