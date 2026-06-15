# Platform Admin Internal Monitoring Probe Persistence Plan

## Scope

This plan is scoped only to persisted runtime probe history for:

```txt
/dashboard/internal-monitoring
```

IM-18 made runtime probes real at request time. IM-19 defined the persistence gate. IM-20 promotes the first persistence layer with a migration SQL artifact and a read-only history endpoint.

## Current state

```txt
Runtime probes: real request-time diagnostics
Backend endpoint: GET /api/internal/health/summary
Persistence migration: implemented as migration SQL
Prisma model source: pending full schema patch review
History API: implemented as GET-only
Scheduled collector: not implemented
Frontend history panel: implemented
```

This phase adds persistence infrastructure but still does not add scheduled writes or frontend mutation controls.

## Persistence artifact

Migration SQL:

```txt
artifacts/api-server/prisma/migrations/20260615000000_add_internal_system_probes/migration.sql
```

Table:

```txt
internal_system_probes
```

Columns:

```txt
id
probe_id
label
area
status
latency_ms
message
observed_at
source
metadata_json
created_at
```

Indexes:

```txt
internal_system_probes_probe_id_observed_at_idx
internal_system_probes_status_observed_at_idx
internal_system_probes_area_observed_at_idx
internal_system_probes_observed_at_idx
```

Status constraint:

```txt
internal_system_probes_status_check: pass, watch, fail
```

## Prisma model proposal

Model name:

```txt
InternalSystemProbe
```

Prisma model source is still pending full `schema.prisma` patch review because the active schema file is large. The migration artifact is the promoted database schema source for this phase.

Planned Prisma fields:

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

Planned Prisma indexes:

```txt
@@index([probeId, observedAt])
@@index([status, observedAt])
@@index([area, observedAt])
@@index([observedAt])
```

## Implemented read-only history API

Endpoint:

```txt
GET /api/internal/probes/history
```

Query parameters:

```txt
probeId optional
status optional: pass, watch, fail
area optional
from optional ISO timestamp
to optional ISO timestamp
limit default 50 max 200
```

Response behavior:

```txt
ready: table exists and query succeeds
schema-missing: migration has not been applied yet
database-unavailable: DATABASE_URL exists but query failed
not-configured: DATABASE_URL is missing
```

The endpoint stays success-envelope compatible and never exposes a write action.

## Frontend history panel

Dashboard section:

```txt
InternalSystemProbe History
```

The panel displays:

```txt
Persistence Status
Retention
Records
Status Mix
Latest history rows
```

If the migration has not been applied, the panel shows `schema-missing` instead of breaking the dashboard. Because blank dashboards are not observability, they are just decorative failure.

## Retention policy

Initial retention target:

```txt
keep 14 days of probe snapshots
compact or delete older rows
```

Retention job is not part of IM-20. It must be planned before enabling scheduled writes.

## Write policy gate

Probe writes may be enabled only after:

```txt
- Prisma schema source includes InternalSystemProbe
- migration reviewed and applied
- backend write path is service-only, not public frontend action
- read-only frontend contract stays unchanged
- audit note exists for enabling scheduled probe writes
- retention strategy exists
- rate limit or write interval exists
- rollback command is documented
```

## Validation gate

Before enabling scheduled writes, run:

```bash
pnpm platform-admin:check
pnpm platform-admin:contract-parity
pnpm platform-admin:policy-parity
pnpm platform-admin:persistence-plan
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Required manual review:

```txt
- confirm migration SQL applied cleanly
- confirm DATABASE_URL is stable
- confirm GET /api/internal/probes/history returns ready or schema-missing intentionally
- confirm no /api/internal POST/PATCH/DELETE endpoint is added
- confirm dashboard history panel renders without write controls
```

## Rollback plan

If the migration causes issues:

```txt
1. disable any future scheduled probe writes
2. keep request-time probes active
3. keep history panel read-only and tolerate schema-missing
4. roll back the migration only after data/export review
5. keep /api/internal/health/summary GET-only
```

## Still blocked after IM-20

```txt
- scheduled collector
- probe write endpoint exposed to frontend
- alert persistence
- alert acknowledgement mutation
- destructive internal controls
```

## Exit criteria for IM-20

```txt
- migration SQL exists
- GET /api/internal/probes/history exists
- history repository reads internal_system_probes safely
- history endpoint handles schema-missing without crashing
- frontend API client loads probe history
- Control Room renders InternalSystemProbe History
- contract parity snapshot includes probe history endpoint and DTOs
- platform-admin:check includes persistence and contract gates
```
