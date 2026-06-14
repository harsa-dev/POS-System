# Raw Material Phase 8B - Status Frontend Action

Status: implemented.

## Goal

Move Raw Material workflow status frontend actions from legacy resource mutation routes to the explicit Phase 8A status route family.

The UI still uses backend workflow reads before enabling actions, keeps mock fallback read-only, and refreshes workflow reads after each successful status action.

## Implemented file

```txt
artifacts/pos-system/src/features/raw-material/core-system/raw-material-workflow-status.api-client.ts
```

The existing mounted UI remains:

```txt
artifacts/pos-system/src/app/workspace/raw-material/raw-material-workflow-status-actions.tsx
artifacts/pos-system/src/app/workspace/raw-material/raw-material-draft-forms.tsx
```

## Frontend action routing

Phase 8B now routes all status actions through these explicit status endpoints:

```txt
POST /raw-material/status/intakes/{id}
POST /raw-material/status/batches/{id}
POST /raw-material/status/processing-runs/{id}
POST /raw-material/status/pens/{id}
```

## Action mapping

### Cancel intake

```txt
POST /raw-material/status/intakes/{id}
Body: { status: "CANCELLED" }
```

### Set batch quality

```txt
POST /raw-material/status/batches/{id}
Body: { status: "ACCEPTED" | "INSPECTION" | "REJECTED" }
```

### Quarantine batch

```txt
POST /raw-material/status/batches/{id}
Body: { status: "QUARANTINED" }
```

### Set processing status

```txt
POST /raw-material/status/processing-runs/{id}
Body: { status: "PLANNED" | "RUNNING" | "COMPLETED" }
```

### Cancel processing run

```txt
POST /raw-material/status/processing-runs/{id}
Body: { status: "CANCELLED" }
```

### Set kandang health

```txt
POST /raw-material/status/pens/{id}
Body: { healthStatus: "STABLE" | "MONITORING" | "CRITICAL" }
```

## Compatibility routes

Legacy routes remain available for backend compatibility and older clients:

```txt
DELETE /raw-material/intakes/{id}
PATCH  /raw-material/batches/{id}
DELETE /raw-material/batches/{id}
PATCH  /raw-material/processing-runs/{id}
POST   /raw-material/processing-runs/{id}/cancel
PATCH  /raw-material/pens/{id}
```

The Raw Material frontend status action client no longer uses those legacy routes.

## Frontend behavior retained

```txt
status actions only enable after backend workflow reads load
mock/fallback data remains read-only
backend IDs are the only IDs submitted to status routes
successful actions refresh workflow reads
backend remains source of truth for guards and status transitions
```

## Non-goals

```txt
do not remove compatibility routes
do not create reversal workflow
do not mutate stock directly
do not change Prisma schema
do not add database migration
do not enable create intake/batch/processing write UX
```

## Validation

```bash
pnpm raw-material:check -- --no-smoke
```

Full scoped gate:

```bash
pnpm raw-material:check
```

## Next phase

```txt
Raw Material Phase 8C - Stock adjustment reversal workflow
```
