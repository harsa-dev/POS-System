# Platform Admin Internal Monitoring Probe Persistence Plan

## Scope

This plan is scoped only to persisted runtime probe history for:

```txt
/dashboard/internal-monitoring
```

IM-18 made runtime probes real at request time. IM-19 defines the persistence gate before adding Prisma models or scheduled probe writes.

## Current state

```txt
Runtime probes: real request-time diagnostics
Backend endpoint: GET /api/internal/health/summary
Persistence: not implemented
Prisma model: not implemented
History API: not implemented
Scheduled collector: not implemented
```

This phase does not add Prisma schema changes. It records the exact requirements that must be satisfied before schema promotion.

## Why persistence is needed

Persisted probes should be added only when the dashboard needs more than request-time status.

Valid reasons:

```txt
- uptime trend over time
- database connectivity history
- internal API health history
- release readiness audit evidence
- incident reconstruction
- probe flakiness detection
```

Invalid reasons:

```txt
- making the dashboard look more enterprise
- storing mock data
- adding a model before a write policy exists
- adding history before retention is defined
```

## Proposed Prisma model

Model name:

```txt
InternalSystemProbe
```

Proposed fields:

```txt
id                 String   @id @default(cuid())
probeId            String
label              String
area               String
status             String
latencyMs          Int?
message            String
observedAt         DateTime @default(now())
source             String
metadataJson       Json?
createdAt          DateTime @default(now())
```

Proposed indexes:

```txt
@@index([probeId, observedAt])
@@index([status, observedAt])
@@index([area, observedAt])
@@index([observedAt])
```

Allowed status values should mirror runtime probe status:

```txt
pass
watch
fail
```

## Proposed API after schema promotion

Read-only history endpoint:

```txt
GET /api/internal/probes/history
```

Query parameters:

```txt
probeId optional
status optional
area optional
from optional ISO timestamp
to optional ISO timestamp
limit default 100 max 500
```

Write endpoint remains internal-only and must not be exposed to the frontend in the first persistence phase.

Scheduled collector or backend service may write probe snapshots later, but frontend must remain read-only.

## Retention policy

Initial retention target:

```txt
keep 14 days of probe snapshots
compact or delete older rows
```

Retention job is not part of the Prisma model migration. It must be planned before enabling scheduled writes.

## Write policy gate

Probe writes may be enabled only after:

```txt
- Prisma model exists
- migration reviewed
- backend write path is service-only, not public frontend action
- read-only frontend contract stays unchanged
- audit note exists for enabling scheduled probe writes
- retention strategy exists
- rate limit or write interval exists
- rollback command is documented
```

## Migration gate

Before adding the Prisma model, run:

```bash
pnpm platform-admin:check
pnpm platform-admin:contract-parity
pnpm platform-admin:policy-parity
pnpm platform-admin:persistence-plan
pnpm --filter @workspace/api-server run typecheck:restaurant
```

Required manual review:

```txt
- confirm DATABASE_URL is stable
- confirm probe collector returns real runtimeProbes
- confirm model fields and indexes match this plan
- confirm no /api/internal POST/PATCH/DELETE endpoint is added
- confirm history read endpoint is GET-only
```

## Rollback plan

If the migration causes issues:

```txt
1. disable scheduled probe writes
2. keep request-time probes active
3. hide history panel if added
4. roll back the migration only after data/export review
5. keep /api/internal/health/summary GET-only
```

## Do not implement yet

```txt
- InternalSystemProbe Prisma model
- scheduled collector
- probe history chart
- probe history API
- probe write endpoint exposed to frontend
- alert persistence
```

## Exit criteria for this phase

```txt
- this persistence plan exists
- platform-admin:persistence-plan command exists
- platform-admin:check includes the persistence plan gate
- static guard verifies model proposal, retention, migration gate, and blocked internal write endpoints
- docs/platform-admin-internal-monitoring-dashboard-plan.md marks IM-19 as Done
```
