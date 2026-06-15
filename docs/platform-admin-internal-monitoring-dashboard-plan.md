# Platform Admin Internal Monitoring Dashboard Plan

## Scope

This plan is scoped to one dashboard only:

```txt
/dashboard/internal-monitoring
```

It does not implement every Platform Admin dashboard. Internal Monitoring is sensitive because it exposes platform health, route inventory, API readiness, schema risk, release gates, incidents, and future admin action readiness.

Current phase status: read-only dashboard scope is complete through real runtime probe collection without Prisma persistence.

## Current frontend files

```txt
artifacts/pos-system/src/pages/dashboard/platform-monitoring.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/platform-monitoring-content.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx
artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts
artifacts/pos-system/src/components/core/platform-admin/platform-admin-route.tsx
artifacts/pos-system/src/lib/api/internal-monitoring.dto.ts
```

## Current backend files

```txt
artifacts/api-server/src/routes/internal-monitoring.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.types.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.policy.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-response.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.service.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.mock-repository.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-runtime-probes.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-mutation-readiness.ts
```

## Current route

```txt
ROUTES.INTERNAL_MONITORING = /dashboard/internal-monitoring
```

The route is mounted in `artifacts/pos-system/src/App.tsx` through an extracted Platform Admin guard boundary.

## Backend read-only endpoints

Allowed endpoints in this scope:

```txt
GET /api/internal/health/summary
GET /api/internal/routes/inventory
GET /api/internal/contracts/readiness
GET /api/internal/data-integrity/checks
GET /api/internal/mutation-readiness/contracts
```

Blocked in this scope:

```txt
POST /api/internal/*
PATCH /api/internal/*
DELETE /api/internal/*
```

All write behavior remains design-only until dedicated RBAC, audit logging, approval policy, rollback notes, rate limits, and dry-run contracts are implemented.

## Real runtime probe contract

`GET /api/internal/health/summary` now includes runtime probes collected server-side at request time.

Implemented probes:

```txt
api-server-runtime
runtime-environment
internal-contract-inventory
database-connectivity
```

Runtime probe source:

```txt
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-runtime-probes.ts
```

Database connectivity uses a read-only `pg` probe through `DATABASE_URL` and runs `select 1 as internal_monitoring_probe`.

This does not add Prisma models, background jobs, scheduled probes, or historical persistence. Runtime probes are live request-time diagnostics only.

## Frontend data source contract

The dashboard uses a `mock/api/fallback` source model:

```txt
1. Render existing typed mock data immediately.
2. Try read-only backend API.
3. If backend succeeds, show Read-only API source badge.
4. If backend fails, keep mock fallback and show fallback reason.
5. Never call POST/PATCH/DELETE from this dashboard in this scope.
```

Runtime probes appear in the existing cards and runtime signal table when the backend API responds. Fallback mode exposes mock probe warnings so admins can tell the probe collector is not active.

## Contract ownership

Frontend DTOs live in:

```txt
artifacts/pos-system/src/lib/api/internal-monitoring.dto.ts
```

Backend DTOs live in:

```txt
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.types.ts
```

Response helper:

```txt
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring-response.ts
```

Contract snapshot:

```txt
docs/platform-admin-internal-monitoring-contract-snapshot.json
```

Final QA checklist:

```txt
docs/platform-admin-internal-monitoring-final-qa.md
```

## Required commands

```bash
pnpm platform-admin:check
pnpm platform-admin:policy-parity
pnpm platform-admin:contract-parity
pnpm platform-admin:final-qa
pnpm business-mode:check
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Optional browser smoke:

```bash
pnpm platform-admin:browser-smoke
```

## Access policy

Internal Monitoring must not rely on business mode access.

Expected allowed roles:

```txt
OWNER
ADMIN
```

Capability:

```txt
platform-admin.internal-monitoring.read
```

This replaces broad `settings.manage` for the Internal Monitoring sidebar entry.

## Implementation phases

```txt
IM-1  Dashboard spec and static guard                         Done
IM-2  Frontend data source adapter                            Done
IM-3  Backend read-only scaffold                              Done
IM-4  Frontend API client integration expansion                Done
IM-5  Platform Admin route guard                              Done
IM-6  Sidebar permission isolation                            Done
IM-7  Policy parity smoke and hardening                       Done
IM-8  Internal Monitoring UX hardening                        Done
IM-9  Internal Monitoring browser smoke                       Done
IM-10 Mutation readiness design and dry-run contract          Done
IM-11 Internal Monitoring typecheck cleanup and extraction    Done
IM-12 Internal Monitoring DTO consolidation                   Done
IM-13 Internal Monitoring contract parity snapshot            Done
IM-14 Internal Monitoring response envelope parity            Done
IM-15 Internal Monitoring runtime status polish               Done
IM-16 Internal Monitoring browser smoke runtime assertions    Done
IM-17 Internal Monitoring final QA checklist                  Done
IM-18 Real runtime probe collector                            Done
```

## IM-18 implemented

```txt
- backend runtime probe collector
- live API process probe
- runtime environment probe
- internal contract inventory probe
- read-only database connectivity probe via pg and DATABASE_URL
- runtime probe DTO in frontend and backend contracts
- health summary includes runtimeProbes and probe summary counts
- mock fallback exposes runtime probe warnings
- contract snapshot includes runtime probe fields and IDs
- contract parity checks runtime probe collector and DTO fields
```

## Scope handoff

Internal Monitoring read-only scope is now ready for validation with live request-time probes.

Next safe scope options:

```txt
1. Run full validation against a real API server and DATABASE_URL.
2. If runtime history is needed, plan InternalSystemProbe persistence as a separate phase.
3. Pick another Platform Admin dashboard one dashboard at a time.
4. Keep next dashboard read-only first.
5. Do not implement platform write behavior until audit, approval, rollback, rate-limit, and dry-run execution contracts are implemented.
```
