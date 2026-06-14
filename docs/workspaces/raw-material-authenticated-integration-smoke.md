# Raw Material Authenticated Integration Smoke

## Status

Implemented.

This post-plan lane hardens the Raw Material API smoke script after the Retail-style implementation plan was completed through Phase 8H.

## Goal

The Raw Material smoke script should verify more than HTTP reachability.

It now checks authenticated Raw Material read endpoints for:

```txt
HTTP success
JSON envelope shape
success=true
data presence
expected data shape
summary required keys
optional seeded row counts
```

## Command

Default authenticated smoke:

```bash
pnpm raw-material:smoke
```

Full scoped validation with smoke:

```bash
pnpm raw-material:check
```

Seed-aware smoke expectations:

```bash
RAW_MATERIAL_SMOKE_EXPECT_SEED=true pnpm raw-material:smoke
```

Windows PowerShell:

```powershell
$env:RAW_MATERIAL_SMOKE_EXPECT_SEED="true"
pnpm raw-material:smoke
```

## Required environment

Authenticated endpoint checks require a logged-in Raw Material session cookie:

```bash
RAW_MATERIAL_API_COOKIE=<session cookie>
```

Optional API base URL:

```bash
RAW_MATERIAL_API_BASE_URL=http://localhost:3001/api
```

If `RAW_MATERIAL_API_COOKIE` is missing, the script still probes `/health` and exits successfully after warning that authenticated checks were skipped.

## Read endpoints covered

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

## Envelope assertions

Every authenticated endpoint must return a JSON object envelope with:

```txt
success=true
data present
```

List endpoints must return `data` as an array.

The summary endpoint must return `data` as an object and include:

```txt
generatedAt
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

## Optional seed assertions

When `RAW_MATERIAL_SMOKE_EXPECT_SEED=true`, the script asserts minimum seeded rows:

```txt
suppliers              >= 3
storage locations      >= 3
intakes                >= 3
weighings              >= 3
batches                >= 3
processing runs        >= 1
kandang pens           >= 2
stock movements        >= 3
```

This should be used after:

```bash
pnpm raw-material:check -- --db --seed --no-smoke
```

or any equivalent local seed flow.

## Non-goals

```txt
No write endpoint execution
No stock mutation
No reversal mutation
No status mutation
No Prisma schema change
No migration change
No global non-Raw-Material typecheck cleanup
```

Write-path integration tests should be added as a separate lane with disposable test data, not hidden inside read-only smoke.

## Validation

Run:

```bash
pnpm raw-material:check -- --no-smoke
```

Then run authenticated smoke separately with a cookie:

```bash
pnpm raw-material:smoke
```

For seeded local DB validation:

```bash
pnpm raw-material:check -- --db --seed --no-smoke
RAW_MATERIAL_SMOKE_EXPECT_SEED=true pnpm raw-material:smoke
```
