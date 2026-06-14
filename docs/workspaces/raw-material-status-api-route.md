# Raw Material Status API Route

Status: implemented.

This document records Raw Material Phase 8A.

## Goal

Add explicit backend status API routes for guarded raw-material workflow status changes.

The previous status-capable routes remain available as compatibility routes, but frontend Phase 8B should target the status route family.

## Implemented files

```txt
artifacts/api-server/src/services/raw-material/raw-material-status.service.ts
artifacts/api-server/src/routes/raw-material-status.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/tsconfig.raw-material.json
artifacts/api-server/src/services/raw-material/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
```

## New backend route family

All routes are business-mode guarded with:

```txt
requireBusinessMode(["raw-material"])
```

All routes use the existing Raw Material permission matrix.

```txt
POST /raw-material/status/intakes/:id
POST /raw-material/status/batches/:id
POST /raw-material/status/processing-runs/:id
POST /raw-material/status/pens/:id
```

## Route behavior

### Intake status

```txt
POST /raw-material/status/intakes/:id
Body: { status: "CANCELLED" }
Permission: raw-material.intake.update
```

Currently supports `CANCELLED` only.

Reason:

```txt
The existing intake update service still requires full intake payload for non-cancel status changes.
The status route intentionally refuses partial non-cancel intake updates instead of pretending to support them.
```

### Batch status

```txt
POST /raw-material/status/batches/:id
Body: { status: "ACCEPTED" | "INSPECTION" | "REJECTED" | "QUARANTINED" }
Permission: raw-material.batch.manage
```

Behavior:

```txt
status=QUARANTINED -> uses deactivateRawMaterialBatch()
other statuses     -> uses updateRawMaterialBatch({ qualityStatus: status })
```

### Processing status

```txt
POST /raw-material/status/processing-runs/:id
Body: { status: "PLANNED" | "RUNNING" | "COMPLETED" | "CANCELLED" }
Permission: raw-material.processing.manage
```

Behavior:

```txt
status=CANCELLED -> uses cancelRawMaterialProcessingRun()
other statuses   -> uses updateRawMaterialProcessingRun({ status })
```

The existing processing workflow transition guard still applies.

### Kandang pen health status

```txt
POST /raw-material/status/pens/:id
Body: { status: "STABLE" | "WATCHLIST" | "CRITICAL" }
Permission: raw-material.kandang.manage
```

The route also accepts:

```txt
{ healthStatus: "STABLE" | "WATCHLIST" | "CRITICAL" }
```

Behavior:

```txt
uses updateRawMaterialPen({ healthStatus })
```

The existing kandang health guard still applies.

## Compatibility routes retained

The following routes still exist and are not removed:

```txt
DELETE /raw-material/intakes/:id
PATCH  /raw-material/batches/:id
DELETE /raw-material/batches/:id
PATCH  /raw-material/processing-runs/:id
POST   /raw-material/processing-runs/:id/cancel
PATCH  /raw-material/pens/:id
```

They remain useful for backward compatibility and existing frontend code until Phase 8B migrates frontend actions.

## Frontend contract metadata

The frontend contract now records both:

```txt
compatibility routes
Phase 8A status route family
```

The new status contract entries are:

```txt
rawMaterialSetIntakeStatus
rawMaterialSetBatchStatus
rawMaterialSetProcessingWorkflowStatus
rawMaterialSetPenWorkflowStatus
```

## Non-goals

This phase does not:

```txt
change Prisma schema
add migrations
change frontend action client behavior
remove compatibility routes
add reversal workflows
mutate stock directly
fix global non-Raw-Material typecheck errors
```

## Validation

Run:

```bash
pnpm raw-material:check -- --no-smoke
```

Full scoped gate:

```bash
pnpm raw-material:check
```

## Next phase

Proceed to Phase 8B:

```txt
Raw Material status frontend action migration
```

Phase 8B should update frontend workflow status client to call the new `/raw-material/status/*` route family instead of the compatibility routes.
