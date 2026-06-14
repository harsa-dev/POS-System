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
stock write delegate
workflow status delegate
status API route family
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
Phase 7E - Stock/write delegate                               Done
Phase 7F - Guarded workflow status delegate                   Done
Phase 8A - Intake/processing/batch status API route           Done
Phase 8B - Status frontend action                             Next
Phase 8C - Stock adjustment reversal workflow                 Planned
Phase 8D - Processing cancellation reversal workflow          Planned
Phase 8E - Generated API client consolidation                 Planned
Phase 8F - Raw Material smoke test + scoped CI gate           Done
Phase 8G - Migration baseline/idempotency hardening           Planned
Phase 8H - Audit + permission policy hardening                Mostly Done, needs smoke/policy assertion
```

## Completed phase notes

### Phase 4 - Seed supplier/storage/intake/batch/kandang

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

### Phase 5 - Frontend list/workflow API wiring

Status: implemented.

Implemented behavior:

```txt
frontend workflow list surfaces are API-first
mock fallback remains available
API contract metadata covers every workflow read endpoint
backend enum casing is mapped into frontend display casing
```

### Phase 6 - Raw Material OpenAPI/client coverage

Status: implemented.

Implemented files:

```txt
lib/api-spec/openapi.yaml
artifacts/pos-system/src/features/raw-material/core-system/raw-material.types.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
docs/workspaces/raw-material-openapi-client-coverage.md
```

Generated client replacement remains planned under Phase 8E.

### Phase 7C - Workflow read delegate

Status: implemented.

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

### Phase 7D - Intake/batch/processing preview delegate

Status: implemented.

Preview endpoints:

```txt
POST /raw-material/previews/intake
POST /raw-material/previews/batch
POST /raw-material/previews/processing-run
```

Preview endpoints are read-only and return `canProceed`, `blockingIssues`, `warnings`, and `estimates`.

### Phase 7E - Stock/write delegate

Status: implemented.

Implemented files:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material-stock-write.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-stock-write-actions.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-draft-forms.tsx
docs/workspaces/raw-material-stock-write-delegate.md
```

Wired write endpoints:

```txt
POST /raw-material/stock-movements/adjust
POST /raw-material/stock-movements/transfer
POST /raw-material/stock-movements/consume-processing
```

Behavior:

```txt
frontend stock writes only enable after backend workflow data loads
mock/fallback IDs are never submitted to write endpoints
successful write refreshes workflow reads
backend remains source of truth for stock guards, ledger rows, and audit logs
```

### Phase 7F - Guarded workflow status delegate

Status: implemented.

Implemented files:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material-workflow-status.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-workflow-status-actions.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-draft-forms.tsx
docs/workspaces/raw-material-workflow-status-delegate.md
```

Wired workflow status endpoints:

```txt
DELETE /raw-material/intakes/{id}
PATCH  /raw-material/batches/{id}
DELETE /raw-material/batches/{id}
PATCH  /raw-material/processing-runs/{id}
POST   /raw-material/processing-runs/{id}/cancel
PATCH  /raw-material/pens/{id}
```

Behavior:

```txt
frontend workflow status actions only enable after backend workflow data loads
mock/fallback IDs are never submitted to status endpoints
successful status action refreshes workflow reads
backend remains source of truth for intake cancellation, batch quality/quarantine, processing transition, processing cancellation, and kandang health guards
```

### Phase 8A - Intake/processing/batch status API route

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material-status.service.ts
artifacts/api-server/src/routes/raw-material-status.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/tsconfig.raw-material.json
artifacts/api-server/src/services/raw-material/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
docs/workspaces/raw-material-status-api-route.md
```

New backend status routes:

```txt
POST /raw-material/status/intakes/{id}
POST /raw-material/status/batches/{id}
POST /raw-material/status/processing-runs/{id}
POST /raw-material/status/pens/{id}
```

Behavior:

```txt
intake route currently supports status=CANCELLED only
batch route supports quality status changes and QUARANTINED alias
processing route supports guarded transition and CANCELLED alias
pen route supports health status changes through existing kandang guard
compatibility routes remain available until Phase 8B migrates frontend actions
```

### Phase 8F - Raw Material smoke test + scoped CI gate

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

The scoped gate intentionally excludes global non-Raw-Material typecheck errors.

## Recommended next execution order

Preferred path:

```txt
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
