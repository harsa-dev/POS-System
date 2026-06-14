# Platform Admin - Internal Monitoring Dashboard Plan

## Scope

This plan scopes only the Internal Monitoring dashboard:

```txt
/dashboard/internal-monitoring
```

It does not implement the other Platform Admin dashboards yet.

Internal Monitoring is sensitive because it exposes platform health, route inventory, API readiness, schema risk, release gates, incidents, and future admin action readiness. Phase 1 must stay read-only.

## Related frontend files

```txt
artifacts/pos-system/src/pages/dashboard/platform-monitoring.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/platform-monitoring-content.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-dashboard.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-deep-dive.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-data-source.ts
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-upgrade-board.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-upgrade.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-contracts.mock.ts
artifacts/pos-system/src/lib/api/internal-monitoring-api.ts
artifacts/pos-system/src/constants/routes.ts
artifacts/pos-system/src/App.tsx
```

## Related backend files

```txt
artifacts/api-server/src/routes/internal-monitoring.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.types.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.policy.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.mock-repository.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.service.ts
```

## Dashboard sections

The advanced Internal Monitoring dashboard should contain these sections:

```txt
1. Executive System Summary
2. Service Health Monitor
3. Business Mode Runtime Snapshot
4. Route Ownership Matrix
5. API Contract Readiness
6. Data Integrity Checks
7. Schema Candidate / Migration Risk
8. Release Gates
9. Incident Timeline / Internal Alerts
10. Dev Action Queue
11. Observability Targets
```

## Backend read-only endpoints

Implemented backend endpoints for the first backend phase:

```txt
GET /api/internal/health/summary
GET /api/internal/routes/inventory
GET /api/internal/contracts/readiness
GET /api/internal/data-integrity/checks
```

Blocked until later:

```txt
POST /api/internal/*
PATCH /api/internal/*
DELETE /api/internal/*
PATCH /api/internal/alerts/:alertId/acknowledge
```

## Backend module target

Backend scaffold:

```txt
artifacts/api-server/src/routes/internal-monitoring.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.types.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.policy.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.mock-repository.ts
artifacts/api-server/src/services/platform-admin/internal-monitoring/internal-monitoring.service.ts
```

Rules:

```txt
1. GET only.
2. Auth required.
3. Platform Admin capability guard required.
4. No Prisma mutation.
5. No Prisma schema promotion in phase 1.
6. Mock-backed repository is allowed.
7. Response envelope must be consistent.
```

## Frontend implementation target

Frontend API client:

```txt
artifacts/pos-system/src/lib/api/internal-monitoring-api.ts
```

Implemented methods:

```txt
internalMonitoringApi.getControlRoom()
internalMonitoringApi.getRouteInventory()
internalMonitoringApi.getContractReadiness()
internalMonitoringApi.getDataIntegrityChecks()
```

No frontend method may call POST, PATCH, or DELETE for `/api/internal/*` in the first implementation phase.

## Data source strategy

Internal Monitoring supports three data states:

```txt
mock     -> current static mock data
api      -> backend read-only API succeeds
fallback -> API fails and UI falls back to mock data with warning copy
```

Implemented adapter:

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-data-source.ts
```

The Control Room now loads all four read-only endpoints:

```txt
GET /api/internal/health/summary
GET /api/internal/routes/inventory
GET /api/internal/contracts/readiness
GET /api/internal/data-integrity/checks
```

Each section has its own fallback path. If one endpoint fails, the dashboard keeps rendering and shows the section fallback reason instead of blanking the whole control room.

## Access policy

Internal Monitoring must not rely on business mode access.

Temporary backend policy:

```txt
OWNER and ADMIN may inspect Internal Monitoring read-only payloads.
```

Temporary frontend policy:

```txt
OWNER and ADMIN may view Internal Monitoring.
MANAGER, OPERATOR, STAFF, and VIEWER should not get future platform admin action access.
```

Future capability:

```txt
platform-admin.internal-monitoring.read
```

This must replace broad `settings.manage` for the Internal Monitoring sidebar entry in a later phase.

## Sensitive implementation rules

```txt
1. Do not implement real platform mutation in Internal Monitoring.
2. Do not add POST/PATCH/DELETE internal endpoints yet.
3. Do not add Prisma models for InternalSystemProbe or InternalAlert yet.
4. Do not add alert acknowledgement mutation yet.
5. Do not wire tenant suspension, billing refund, role elevation, support reset, or audit export here.
6. Any future action must require RBAC, audit event, approval policy, rollback note, rate limit, and dry-run mode.
```

## Implementation phases

### IM-1 - Dashboard spec and static guard

Status: Done.

Done when:

```txt
- this plan exists
- scripts/platform-admin-internal-monitoring-check.mjs exists
- root command pnpm platform-admin:check exists
- static check blocks accidental /api/internal/* mutations
```

### IM-2 - Frontend data source adapter

Status: Done.

Implemented:

```txt
- GET-only frontend API client
- mock/api/fallback data source adapter
- Control Room source badge
- Refresh Source action
- fallback reason copy
- static guard checks for adapter + API client
```

### IM-3 - Backend read-only scaffold

Status: Done.

Implemented:

```txt
- GET-only backend route under /api/internal/*
- mock-backed service and repository
- read policy with platform-admin.internal-monitoring.read capability label
- no Prisma schema changes
- no POST/PATCH/DELETE internal routes
- static guard checks backend route/service/policy
```

### IM-4 - Frontend API client integration expansion

Status: Done.

Implemented:

```txt
- frontend API client methods for all four GET endpoints
- adapter loads health summary, route inventory, contract readiness, and integrity checks
- per-section fallback reasons
- Route Inventory panel
- Data Integrity Checks panel
- static guard checks expanded frontend integration
```

### IM-5 - Platform Admin route guard

Next.

Add dedicated Platform Admin guard for `/dashboard/internal-monitoring`.

### IM-6 - Sidebar permission isolation

Move Internal Monitoring entry away from broad `settings.manage` into `platform-admin.internal-monitoring.read`.
