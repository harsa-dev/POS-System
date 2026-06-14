# Raw Material Workflow Status Delegate

Status: implemented.

This document records Raw Material Phase 7F.

## Goal

Wire guarded frontend workflow status actions to existing backend Raw Material routes.

This phase does not introduce new backend status routes. Dedicated status API routes remain planned for Phase 8A.

## Implemented files

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material-workflow-status.api-client.ts
artifacts/pos-system/src/features/raw-material/core-system/index.ts
artifacts/pos-system/src/features/raw-material/core-system/raw-material.api-contract.ts
artifacts/pos-system/src/app/workspace/raw-material/raw-material-workflow-status-actions.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-draft-forms.tsx
```

## Guarded status client

Implemented client:

```txt
rawMaterialWorkflowStatusApiClient
```

Functions:

```txt
cancelIntake(id)
setBatchQualityStatus(id, qualityStatus)
quarantineBatch(id)
setProcessingStatus(id, status)
cancelProcessingRun(id)
setPenHealthStatus(id, healthStatus)
```

## Backend routes consumed

```txt
DELETE /raw-material/intakes/{id}
PATCH  /raw-material/batches/{id}
DELETE /raw-material/batches/{id}
PATCH  /raw-material/processing-runs/{id}
POST   /raw-material/processing-runs/{id}/cancel
PATCH  /raw-material/pens/{id}
```

## Frontend behavior

The workspace now mounts:

```txt
RawMaterialWorkflowStatusActions
```

The component:

```txt
loads backend workflow reads first
only enables status actions when workflow source is api
disables actions when fallback/mock data is active
submits only backend IDs
refreshes workflow reads after successful status action
surfaces backend guard errors through workspace notice
```

## Status actions

### Intake cancellation

```txt
Action: cancel intake
Route: DELETE /raw-material/intakes/{id}
Guard source: backend intake cancellation guard
```

### Batch quality status

```txt
Action: set batch quality
Route: PATCH /raw-material/batches/{id}
Allowed frontend values: ACCEPTED, INSPECTION, REJECTED
Guard source: backend batch update guard
```

### Batch quarantine

```txt
Action: quarantine batch
Route: DELETE /raw-material/batches/{id}
Guard source: backend batch deactivate/quarantine guard
```

### Processing status transition

```txt
Action: set processing status
Route: PATCH /raw-material/processing-runs/{id}
Allowed frontend values: PLANNED, RUNNING, COMPLETED
Guard source: backend processing transition matrix
```

### Processing cancellation

```txt
Action: cancel processing run
Route: POST /raw-material/processing-runs/{id}/cancel
Guard source: backend processing cancellation guard
```

### Kandang pen health

```txt
Action: set kandang health
Route: PATCH /raw-material/pens/{id}
Allowed frontend values: STABLE, MONITORING, CRITICAL
Guard source: backend kandang health guard
```

## Contract metadata

The Raw Material API contract now records the status operations:

```txt
rawMaterialCancelIntake
rawMaterialSetBatchQualityStatus
rawMaterialQuarantineBatch
rawMaterialSetProcessingStatus
rawMaterialCancelProcessingRun
rawMaterialSetPenHealthStatus
```

## Non-goals

```txt
No new backend status route.
No new Prisma schema or migration.
No reversal workflow.
No frontend write action for creating intakes, batches, weighings, processing runs, suppliers, or storage locations.
No mock-data submission to backend.
No global non-Raw-Material typecheck cleanup.
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

```txt
Raw Material Phase 8A - Intake/processing/batch status API route
```
