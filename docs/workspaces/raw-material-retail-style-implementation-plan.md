# Raw Material Retail-Style Implementation Plan

This document maps Raw Material work into the same implementation format used by Retail.

It does not replace the original Raw Material phase plan. It is the forward execution plan after Raw Material phase 0-9 was completed.

## Current validation baseline

Raw Material phase 0-9 is implemented.

Known completed capabilities:

```txt
persistence foundation
backend routes
permission hardening
workflow guards
domain invariants
service layer cleanup
audit integration
shared dashboard summary
raw-material typecheck cleanup
stock mutation hardening
frontend summary API sync with mock fallback
seeded demo data
scoped validation gate
read-only API smoke script
workflow read delegate
frontend list/workflow API wiring
OpenAPI endpoint coverage
frontend contract operationId mapping
preview delegate
```

## Retail-style Raw Material phases

```txt
Phase 1  - Raw Material persistence foundation                Done
Phase 2  - Backend route, guard, workflow preview             Done
Phase 3  - Shared dashboard backend summary                   Done
Phase 4  - Seed supplier/storage/intake/batch/kandang         Done
Phase 5  - Frontend list/workflow API wiring                  Done
Phase 6  - Raw Material OpenAPI/client coverage               Done
Phase 7A - Prisma schema model mapping                        Done
Phase 7B - Summary read delegate                              Done
Phase 7C - Workflow read delegate                             Done
Phase 7D - Intake/batch/processing preview delegate           Done
Phase 7E - Stock/write delegate                               Backend Done, Frontend Planned
Phase 7F - Guarded workflow status delegate                   Backend Partial, Frontend Planned
Phase 8A - Intake/processing/batch status API route           Planned
Phase 8B - Status frontend action                             Planned
Phase 8C - Stock adjustment reversal workflow                 Planned
Phase 8D - Processing cancellation reversal workflow          Planned
Phase 8E - Generated API client consolidation                 Planned
Phase 8F - Raw Material smoke test + scoped CI gate           Done
Phase 8G - Migration baseline/idempotency hardening           Planned
Phase 8H - Audit + permission policy hardening                Mostly Done, needs smoke/policy assertion
```

## Phase 4 - Seed supplier/storage/intake/batch/kandang

Status: implemented.

Implemented files:

```txt
artifacts/api-server/scripts/seed-raw-material-demo-data.ts
artifacts/api-server/package.json
docs/workspaces/raw-material-seed-demo-data.md
```

Command:

```bash
pnpm --filter @workspace/api-server run raw-material:seed
```

Seeded demo data per active Raw Material business:

```txt
3 suppliers
3 storage locations
3 intakes
3 weighings
3 batches
1 planned processing run
2 kandang pens
3 initial receiving stock movements
```

The seed script is idempotent and scoped to:

```txt
Business.mode = RAW_MATERIAL
Business.isActive = true
```

## Phase 5 - Frontend list/workflow API wiring

Status: implemented.

Implemented files:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-placeholder-workspace.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-readonly-sections.tsx
docs/workspaces/raw-material-frontend-list-workflow-api-wiring.md
```

Implemented behavior:

```txt
frontend workflow list surfaces are API-first
mock fallback remains available
API contract metadata covers every workflow read endpoint
write route metadata exists but write buttons remain disabled
backend enum casing is mapped into frontend display casing
```

Wired read surfaces:

```txt
supplier intake queue
batch traceability
weighing records
storage capacity cards
processing run cards
kandang snapshot cards
supplier filter preview
stock movement trail
transfer preview selectors
processing preview selectors
```

## Phase 6 - Raw Material OpenAPI/client coverage

Status: implemented.

Implemented files:

```txt
lib/api-spec/openapi.yaml
artifacts/pos-system/src/features/raw-material/core-system/raw-material.types.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
docs/workspaces/raw-material-openapi-client-coverage.md
```

Implemented behavior:

```txt
OpenAPI spec includes the raw-material tag
OpenAPI spec covers active Raw Material read endpoints
OpenAPI spec covers currently known Raw Material write endpoints for contract visibility
frontend API contract entries include operationId values
operationId values align with OpenAPI operation IDs
handwritten frontend client remains active until generated client consolidation
```

Covered read operations:

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

Generated client replacement remains planned under Phase 8E.

## Phase 7C - Workflow read delegate

Status: implemented.

Implemented files:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.types.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-placeholder-workspace.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-workspace.constants.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-workspace.utils.ts
docs/workspaces/raw-material-workflow-read-delegate.md
```

Backend read endpoints consumed:

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

Behavior:

```txt
frontend workflow lists load from backend first
mock fallback remains available
backend DTO enum casing is mapped to existing frontend display casing
stock movement trail now reads from backend ledger rows
write actions remain disabled
```

## Phase 7D - Intake/batch/processing preview delegate

Status: implemented.

Implemented backend files:

```txt
artifacts/api-server/src/services/raw-material/raw-material-preview.service.ts
artifacts/api-server/src/routes/raw-material-preview.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/tsconfig.raw-material.json
```

Implemented frontend files:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material-preview.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-draft-forms.tsx
docs/workspaces/raw-material-preview-delegate.md
```

Preview endpoints:

```txt
POST /raw-material/previews/intake
POST /raw-material/previews/batch
POST /raw-material/previews/processing-run
```

Behavior:

```txt
preview endpoints are read-only
preview response includes canProceed, blockingIssues, warnings, and estimates
intake draft form calls backend preview first
if backend preview blocks the intake draft, local draft is not created
if preview API is unavailable, local fallback remains available
batch and processing preview client functions are available for the next write UX delegate
write buttons remain disabled
```

## Phase 8F - Raw Material smoke test + scoped CI gate

Status: implemented.

Implemented files:

```txt
scripts/raw-material-check.mjs
scripts/raw-material-api-smoke.mjs
package.json
artifacts/api-server/package.json
artifacts/api-server/tsconfig.raw-material.json
artifacts/pos-system/package.json
artifacts/pos-system/tsconfig.raw-material.json
docs/workspaces/raw-material-smoke-test-scoped-ci.md
```

Commands:

```bash
pnpm raw-material:check
pnpm raw-material:smoke
```

Optional flags:

```bash
pnpm raw-material:check -- --seed
pnpm raw-material:check -- --no-build
pnpm raw-material:check -- --no-smoke
```

The scoped gate intentionally excludes global non-Raw-Material typecheck errors.

## Recommended next execution order

Preferred path:

```txt
Phase 7E - Stock/write delegate frontend wiring
Phase 7F - Guarded workflow status delegate
Phase 8A - Status API route
Phase 8B - Status frontend action
Phase 8C - Stock adjustment reversal workflow
Phase 8D - Processing cancellation reversal workflow
Phase 8G - Migration baseline/idempotency hardening
Phase 8H - Audit + permission policy hardening
```

## Validation commands

Raw Material scoped validation:

```bash
pnpm raw-material:check
```

Raw Material scoped validation without frontend bundle build:

```bash
pnpm raw-material:check -- --no-build
```

Raw Material scoped API smoke only:

```bash
pnpm raw-material:smoke
```

Retail scoped validation remains separate:

```bash
pnpm retail:check
```
