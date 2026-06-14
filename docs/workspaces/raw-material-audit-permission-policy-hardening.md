# Raw Material Phase 8H - Audit + Permission Policy Hardening

Status: implemented.

This phase formalizes Raw Material audit and permission policy into a typechecked matrix and wires that matrix into the Raw Material scoped validation gate.

## Goals

```txt
make Raw Material route/action permission policy explicit
make mutation audit expectations explicit
keep preview/read endpoints marked as non-audited by design
add a scoped policy assertion step to raw-material:check
avoid changing runtime route behavior unless the policy matrix exposes drift
```

## Implemented files

```txt
artifacts/api-server/src/services/raw-material/raw-material.audit.ts
artifacts/api-server/src/services/raw-material/raw-material.policy.ts
artifacts/api-server/src/services/raw-material/index.ts
artifacts/api-server/scripts/check-raw-material-policy.ts
artifacts/api-server/package.json
scripts/raw-material-check.mjs
docs/workspaces/raw-material-audit-permission-policy-hardening.md
```

## Audit constants

`raw-material.audit.ts` now exports stable audit entity and operation constants.

Entity constants:

```txt
raw-material.supplier
raw-material.storage-location
raw-material.intake
raw-material.weighing
raw-material.batch
raw-material.processing-run
raw-material.kandang-pen
raw-material.stock-movement
```

Operation constants:

```txt
create
update
update-status
cancel
deactivate
adjust-stock
reverse-adjustment
transfer-stock
consume-processing
cancel-processing-with-reversal
```

The existing `writeRawMaterialAuditLog()` behavior remains unchanged.

## Policy matrix

New file:

```txt
artifacts/api-server/src/services/raw-material/raw-material.policy.ts
```

The policy matrix maps each Raw Material action surface to:

```txt
id
method
path
permission
audit requirement
note
```

Example policy entry categories:

```txt
summary.read                         -> raw-material.view, no audit, read-only
suppliers.create                     -> raw-material.supplier.manage, audit required
intakes.cancel                       -> raw-material.intake.update, audit required
batches.status                       -> raw-material.batch.manage, audit required
processing-runs.status               -> raw-material.processing.manage, audit required
stock-movements.adjust               -> raw-material.stock.adjust, audit required
stock-movements.reverse-adjustment   -> raw-material.stock.adjust, audit required
previews.processing-run              -> raw-material.view, no audit, preview-only
```

## Permission coverage assertion

The policy file exports:

```txt
assertRawMaterialPolicyCoverage()
getRawMaterialPolicySnapshot()
getRawMaterialPolicyEntriesByPermission()
RAW_MATERIAL_POLICY_MATRIX
RAW_MATERIAL_SENSITIVE_POLICY_ENTRY_IDS
```

`assertRawMaterialPolicyCoverage()` checks:

```txt
every defined Raw Material permission appears in the policy matrix
every policy entry resolves to at least one role
```

This catches policy drift before a route family quietly grows outside the permission matrix. Because apparently route sprawl is a renewable resource.

## Scoped policy check script

New script:

```txt
artifacts/api-server/scripts/check-raw-material-policy.ts
```

Package command:

```bash
pnpm --filter @workspace/api-server run raw-material:policy:check
```

Expected output:

```txt
Raw Material audit and permission policy matrix is valid.
Policy entries: <count>
Sensitive/audited entries: <count>
Read-only or preview entries: <count>
```

## raw-material:check integration

`raw-material:check` now includes this step:

```txt
Check Raw Material audit and permission policy
```

So the default scoped gate now covers:

```txt
DB baseline when --db is enabled
Prisma client generation
API server scoped typecheck
Raw Material audit/permission policy check
POS frontend scoped typecheck
frontend build unless --no-build is used
API smoke unless --no-smoke is used
```

## Read-only and preview audit rule

Read-only endpoints intentionally do not write audit logs:

```txt
GET /raw-material/summary
GET /raw-material/suppliers
GET /raw-material/storage-locations
GET /raw-material/intakes
GET /raw-material/weighings
GET /raw-material/batches
GET /raw-material/processing-runs
GET /raw-material/pens
GET /raw-material/stock-movements
```

Preview endpoints are also non-audited by design because they must not mutate data:

```txt
POST /raw-material/previews/intake
POST /raw-material/previews/batch
POST /raw-material/previews/processing-run
```

## Audited mutation surfaces

Audited mutation surfaces include:

```txt
supplier create/update/deactivate
storage create/update/deactivate
intake create/update/cancel
weighing create/update/delete
batch create/update/status/quarantine
processing create/update/status/cancel-with-reversal
kandang pen create/update/status
stock adjustment
stock adjustment reversal
stock transfer
stock processing consumption
processing cancellation stock reversal
```

The phase does not rewrite every service call to constants yet. It introduces the typed constants and the policy matrix boundary so future changes have a stable target instead of more scattered strings, humanity's least impressive invention after printer drivers.

## Non-goals

```txt
No Prisma schema change
No database migration
No new Raw Material route behavior
No global permission refactor
No full audit-log query UI
No removal of compatibility routes
No fix for non-Raw-Material global errors
```

## Validation

Run:

```bash
pnpm raw-material:check -- --no-smoke
```

For DB baseline too:

```bash
pnpm raw-material:check -- --db --no-smoke
```

Full gate:

```bash
pnpm raw-material:check
```

## Next phase

The Retail-style Raw Material implementation plan is complete through Phase 8H.

Recommended follow-up lanes:

```txt
raw-material full integration smoke with authenticated cookie
raw-material frontend create intake/batch/processing write UX
raw-material exact OpenAPI schema expansion
global non-Raw-Material typecheck cleanup
```
