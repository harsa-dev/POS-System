# Raw Material Preview Delegate

Status: implemented.

This document records Raw Material Phase 7D.

## Goal

Add API-backed preview delegates for intake, batch, and processing workflows.

The preview delegates are read-only.
They do not create rows.
They do not write audit logs.
They do not mutate stock.
They do not enable frontend write buttons.

## Backend files

```txt
artifacts/api-server/src/services/raw-material/raw-material-preview.service.ts
artifacts/api-server/src/routes/raw-material-preview.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/tsconfig.raw-material.json
```

## Backend endpoints

```txt
POST /raw-material/previews/intake
POST /raw-material/previews/batch
POST /raw-material/previews/processing-run
```

All endpoints use:

```txt
requireBusinessMode(["raw-material"])
requireRawMaterialPermission(..., raw-material.view)
requireBusinessContextForRequest(...)
```

## Preview response shape

```txt
{
  kind: "intake" | "batch" | "processing-run",
  canProceed: boolean,
  blockingIssues: string[],
  warnings: string[],
  estimates: object,
  previewedAt: string,
  source: "api-server-prisma-raw-material-preview"
}
```

Blocking issues are returned as data instead of throwing API errors for normal preview validation.
This lets the frontend show why a preview is blocked without treating every invalid draft as a transport failure.

## Intake preview

Endpoint:

```txt
POST /raw-material/previews/intake
```

Checks:

```txt
material name exists
supplier exists and is active
target storage exists and is active
received quantity > 0
accepted/rejected quantity is not negative
accepted + rejected <= received
accepted quantity does not exceed target storage capacity
```

Estimates:

```txt
acceptance rate
storage used before
storage used after accepted quantity
storage available after accepted quantity
supplier name
storage label
```

## Batch preview

Endpoint:

```txt
POST /raw-material/previews/batch
```

Checks:

```txt
intake exists
storage exists and is active
lot code conflict when provided
quantity > 0
remaining quantity within batch quantity
intake status is accepted or partially rejected
batch total would not exceed intake accepted quantity
```

Estimates:

```txt
existing batch quantity for intake
next batch quantity for intake
remaining accepted quantity after preview
intake reference
storage label
batch quality status
```

## Processing run preview

Endpoint:

```txt
POST /raw-material/previews/processing-run
```

Checks:

```txt
input batch exists
input batch is active
input batch is accepted
input batch unit is KG
input quantity > 0
input quantity <= remaining batch quantity
source storage contains enough quantity
output/byproduct/waste quantities are not negative
output + byproduct + waste <= input
```

Estimates:

```txt
output quantity
byproduct quantity
waste quantity
total output quantity
yield percent
loss quantity
remaining batch quantity after processing
storage used after processing
```

## Frontend files

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material-preview.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-draft-forms.tsx
```

## Frontend behavior

Implemented:

```txt
frontend preview API client for intake, batch, and processing-run previews
contract metadata for all preview endpoints
intake draft form calls backend intake preview first
if intake preview blocks, local draft is not created
if preview API is unavailable, local draft fallback remains available
```

Processing and batch preview APIs are available through the client and contract metadata.
The existing processing card still keeps local fallback until the write UX delegate is enabled.

## Non-goals

```txt
No write button enablement
No stock mutation
No audit write
No generated client replacement
No Prisma schema change
No migration
No global non-Raw-Material cleanup
```

## Validation

Run:

```bash
pnpm raw-material:check -- --no-smoke
```

Optional API smoke remains:

```bash
pnpm raw-material:smoke
```

The current API smoke is read-only and does not POST preview endpoints by default.
Preview endpoint smoke can be added later if an authenticated test fixture is available.

## Next phase

Proceed to:

```txt
Raw Material Phase 7E - Stock/write delegate frontend wiring
```
