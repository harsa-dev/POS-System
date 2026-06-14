# Custom Business Service Phase 8A - Status API Route Family

Status: implemented.

This phase adds an explicit status route family for Business Mode Service so future frontend status actions can call a stable façade instead of the older guarded-status compatibility route directly.

## Goals

```txt
add explicit Service status route family
reuse existing transition preview and readiness guard
keep audit logging on status mutation
keep old guarded-status route for compatibility
include new route in scoped Service API typecheck
prepare frontend operation registry for Phase 8B migration
```

## Implemented files

```txt
artifacts/api-server/src/routes/service-business-status.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/tsconfig.service.json
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
docs/workspaces/custom-business-service-status-api-route.md
```

## New endpoints

```txt
POST /custom-business/service/status/jobs/:id
POST /custom-business/service/status/requests/:id
```

Both endpoints accept:

```json
{
  "status": "IN_PROGRESS",
  "note": "Optional operator note"
}
```

`nextStatus` is also accepted as a compatibility alias for `status`.

## Permission

The new status route family uses:

```txt
service-business.job.status.update
```

through `SERVICE_BUSINESS_PERMISSIONS.jobStatusUpdate`.

## Guard behavior

The route reuses the existing workflow guard path:

```txt
findServiceWorkflowTarget
loadServiceWorkflowReadiness
buildServiceTransitionPreview
updateServiceWorkflowStatus
presentServiceStatusMutation
```

Rejected cases:

```txt
400 invalid or missing status
404 workflow target not found
409 disallowed status transition
422 unmet transition requirements
```

## Audit behavior

Successful mutations write a Service audit log with:

```txt
entityType = ServiceWorkflowStatus
entityId = target.jobId ?? target.requestId
from status
to status
requestCode
note
targetType job/request
```

The original guarded route used `ServiceJob`; this façade uses `ServiceWorkflowStatus` to make the audit entity clearer for route-family status changes.

## Compatibility route retained

The old route remains active:

```txt
PATCH /custom-business/service/jobs/:id/guarded-status
```

It is kept for existing frontend/client compatibility. Phase 8B will migrate frontend status actions to the new route family.

## Frontend operation registry

The operation registry now knows the new endpoints:

```txt
serviceBusinessSetJobStatus
serviceBusinessSetRequestStatus
```

No frontend status client migration happens in this phase. The route exists and is ready; Phase 8B performs the actual client switch.

## Non-goals

```txt
no frontend action migration
no compatibility route removal
no quote/invoice reversal
no payment reversal
no Prisma schema change
no migration
no global typecheck cleanup
```

## Validation

Run:

```bash
pnpm service:check -- --no-smoke
```

For DB-backed validation with demo data:

```bash
pnpm service:check -- --db --seed --no-smoke
```

## Next phase

```txt
Service Phase 8B - Service status frontend action
```
