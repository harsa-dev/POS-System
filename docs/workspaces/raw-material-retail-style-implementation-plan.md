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
status frontend action migrated to status route family
stock adjustment reversal workflow
processing cancellation reversal workflow
generated API client consolidation boundary
migration baseline/idempotency hardening
audit + permission policy hardening
authenticated integration smoke hardening
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
Phase 8B - Status frontend action                             Done
Phase 8C - Stock adjustment reversal workflow                 Done
Phase 8D - Processing cancellation reversal workflow          Done
Phase 8E - Generated API client consolidation                 Done
Phase 8F - Raw Material smoke test + scoped CI gate           Done
Phase 8G - Migration baseline/idempotency hardening           Done
Phase 8H - Audit + permission policy hardening                Done
```

## Phase execution notes

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

Wired write endpoints:

```txt
POST /raw-material/stock-movements/adjust
POST /raw-material/stock-movements/transfer
POST /raw-material/stock-movements/consume-processing
POST /raw-material/stock-movements/{id}/reverse-adjustment
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

Status actions now use the Phase 8A status route family after Phase 8B migration.

### Phase 8A - Intake/processing/batch status API route

Status: implemented.

Backend status route family:

```txt
POST /raw-material/status/intakes/{id}
POST /raw-material/status/batches/{id}
POST /raw-material/status/processing-runs/{id}
POST /raw-material/status/pens/{id}
```

### Phase 8B - Status frontend action

Status: implemented.

Frontend workflow status actions now use:

```txt
POST /raw-material/status/intakes/{id}
POST /raw-material/status/batches/{id}
POST /raw-material/status/processing-runs/{id}
POST /raw-material/status/pens/{id}
```

Compatibility routes remain available but are no longer used by the frontend workflow status client.

### Phase 8C - Stock adjustment reversal workflow

Status: implemented.

Reversal endpoint:

```txt
POST /raw-material/stock-movements/{id}/reverse-adjustment
```

Behavior:

```txt
only adjustment movements can be reversed
original movement remains untouched
reversal creates ADJUSTMENT + CORRECTION + SYSTEM movement
sourceId links the reversal to the original movement
same adjustment cannot be reversed twice
batch must still be in the original adjustment storage location
successful reversal refreshes workflow reads
```

### Phase 8D - Processing cancellation reversal workflow

Status: implemented.

Cancellation route:

```txt
POST /raw-material/status/processing-runs/{id}
```

Behavior:

```txt
status=CANCELLED still uses processing transition guards
if no PRODUCTION_USAGE movement exists, the processing run is cancelled normally
if a linked PRODUCTION_USAGE movement exists, stock is restored with a SYSTEM/CORRECTION movement
sourceId links the reversal to the original production usage movement
same consumption movement cannot be reversed twice
batch must still be in the original processing consumption storage location
successful cancellation refreshes workflow reads
```

### Phase 8E - Generated API client consolidation

Status: implemented.

Implemented files:

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material.generated-api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material-preview.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material-stock-write.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material-workflow-status.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
docs/workspaces/raw-material-generated-client-consolidation.md
```

Behavior:

```txt
operationId-to-method/path registry is centralized
path parameter interpolation is centralized
query string handling is centralized
ApiEnvelope unwrapping is centralized
summary, workflow reads, preview, stock writes, reversals, and status actions route through the generated boundary
full OpenAPI code generation remains a future improvement instead of being faked in this phase
```

### Phase 8F - Raw Material smoke test + scoped CI gate

Status: implemented.

Implemented commands:

```bash
pnpm raw-material:check
pnpm raw-material:check -- --db
pnpm raw-material:check -- --seed
pnpm raw-material:check -- --no-build
pnpm raw-material:check -- --no-smoke
pnpm raw-material:smoke
```

### Phase 8G - Migration baseline/idempotency hardening

Status: implemented.

Implemented files:

```txt
artifacts/api-server/prisma/sql/raw-material-baseline-guard.sql
artifacts/api-server/prisma/migrations/202606140006_add_raw_material_core_idempotent/migration.sql
artifacts/api-server/prisma/sql/raw-material-schema-verify.sql
artifacts/api-server/scripts/apply-raw-material-db.mjs
artifacts/api-server/package.json
scripts/raw-material-check.mjs
docs/workspaces/raw-material-migration-baseline-idempotency.md
```

Commands:

```bash
pnpm --filter @workspace/api-server run raw-material:db:apply
pnpm raw-material:check -- --db
pnpm raw-material:check -- --db --seed --no-smoke
```

Behavior:

```txt
raw-material:db:apply avoids global prisma migrate deploy
baseline guard checks Business, User, AuditLog, BusinessType, and BusinessMode
idempotent migration creates or verifies Raw Material enums, tables, and indexes
verify script fails loudly on missing Raw Material tables, columns, or enum values
```

### Phase 8H - Audit + permission policy hardening

Status: implemented.

Implemented files:

```txt
artifacts/api-server/src/services/raw-material/raw-material.audit.ts
artifacts/api-server/src/services/raw-material/raw-material.policy.ts
artifacts/api-server/src/services/raw-material/index.ts
artifacts/api-server/scripts/check-raw-material-policy.ts
artifacts/api-server/package.json
scripts/raw-material-check.mjs
docs/workspaces/raw-material-audit-permission-policy-hardening.md
```

Behavior:

```txt
audit entity and operation constants are centralized
route/action permission policy is documented in a typechecked matrix
sensitive mutation surfaces declare audit requirements
read-only and preview endpoints are marked intentionally non-audited
raw-material:check runs raw-material:policy:check as part of the scoped gate
```

## Post-plan hardening lanes

### Lane A - Raw Material authenticated integration smoke

Status: implemented.

Implemented files:

```txt
scripts/raw-material-api-smoke.mjs
docs/workspaces/raw-material-authenticated-integration-smoke.md
docs/workspaces/raw-material-retail-style-implementation-plan.md
```

Behavior:

```txt
authenticated smoke asserts success envelope, data presence, and response shape
summary smoke asserts required dashboard summary keys
list smoke asserts array data
optional RAW_MATERIAL_SMOKE_EXPECT_SEED=true validates seeded minimum counts
write/status/reversal endpoints remain outside read-only smoke
```

## Current status

```txt
Raw Material Retail-style implementation plan is complete through Phase 8H.
Post-plan Lane A authenticated integration smoke is implemented.
```

## Recommended follow-up lanes

```txt
Raw Material create intake/batch/processing write UX
Raw Material exact OpenAPI schema expansion
Global non-Raw-Material typecheck cleanup
```
