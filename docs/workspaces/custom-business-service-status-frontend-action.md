# Custom Business Service Status Frontend Action

Status: implemented.

This phase migrates the Service Business frontend status action client from the legacy guarded-status endpoint to the explicit Service status route family created in Phase 8A.

## Goals

```txt
use POST /custom-business/service/status/jobs/:id for job status actions
expose POST /custom-business/service/status/requests/:id from the frontend client
keep the legacy guarded-status route available as compatibility surface
document the status route operation IDs in the Service OpenAPI supplement
preserve the existing guarded workflow behavior
```

## Implemented files

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
lib/api-spec/service-business.openapi.yaml
docs/workspaces/custom-business-service-status-frontend-action.md
```

## Frontend client behavior

`serviceBusinessApi.updateJobStatus()` now calls the explicit status route:

```txt
POST /api/custom-business/service/status/jobs/:id
```

Request body:

```json
{
  "status": "IN_PROGRESS",
  "note": "Optional operator note"
}
```

The public frontend input type is still `UpdateServiceJobStatusInput`, so existing callers can keep using `nextStatus` while the client translates it into the route body's `status` field.

## Request status client

The frontend client also exposes:

```txt
serviceBusinessApi.updateRequestStatus(input)
```

This calls:

```txt
POST /api/custom-business/service/status/requests/:id
```

This is included for route parity even if the current UI primarily acts on jobs.

## Compatibility route

The legacy route remains available:

```txt
PATCH /api/custom-business/service/jobs/:id/guarded-status
```

The Service frontend client no longer uses it for `updateJobStatus()`.

## OpenAPI coverage

The Service Business OpenAPI supplement now includes:

```txt
serviceBusinessSetJobStatus
serviceBusinessSetRequestStatus
```

and the corresponding explicit status paths:

```txt
/custom-business/service/status/jobs/{id}
/custom-business/service/status/requests/{id}
```

## Non-goals

```txt
do not remove the legacy guarded-status backend route
do not create reversal workflows here
do not alter Service workflow transition rules
do not change Prisma schema or migrations
do not redesign the frontend status UI
```

## Validation

```bash
pnpm service:check -- --no-smoke
```

With DB setup and seed:

```bash
pnpm service:check -- --db --seed --no-smoke
```

## Next phase

```txt
Service Phase 8C - Quote/invoice cancellation reversal workflow
```