# Platform Admin Internal Monitoring Dashboard Plan

## Scope

This plan is scoped to one dashboard only:

```txt
/dashboard/internal-monitoring
```

It does not implement every Platform Admin dashboard. Internal Monitoring is sensitive because it exposes platform health, route inventory, API readiness, schema risk, release gates, incidents, and future admin action readiness. Phase 1 must stay read-only.

## Current frontend files

```txt
artifacts/pos-system/src/pages/dashboard/platform-monitoring.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/platform-monitoring-content.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-dashboard.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-deep-dive.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-upgrade-board.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-production-readiness-board.tsx
```

## Current route

```txt
ROUTES.INTERNAL_MONITORING = /dashboard/internal-monitoring
```

The route is mounted in `artifacts/pos-system/src/App.tsx` and uses a dedicated Platform Admin guard.

## Advanced dashboard sections

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

## Backend read-only endpoint plan

Allowed in first backend scaffold:

```txt
GET /api/internal/health/summary
GET /api/internal/routes/inventory
GET /api/internal/contracts/readiness
GET /api/internal/data-integrity/checks
```

Blocked until later phases:

```txt
POST /api/internal/*
PATCH /api/internal/*
DELETE /api/internal/*
PATCH /api/internal/alerts/:alertId/acknowledge
```

Alert acknowledgement must stay blocked until dedicated RBAC, audit logging, approval policy, rollback notes, and rate limits are implemented.

## Frontend data source plan

The dashboard uses a `mock/api/fallback` source model:

```txt
1. Render existing typed mock data immediately.
2. Try read-only backend API.
3. If backend succeeds, show Read-only API source badge.
4. If backend fails, keep mock fallback and show fallback reason.
5. Never call POST/PATCH/DELETE from this dashboard in phase 1.
```

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

Capability:

```txt
platform-admin.internal-monitoring.read
```

This capability controls frontend route access, sidebar visibility, and backend read access. `settings.manage` must not control Internal Monitoring visibility.

## Policy parity smoke

Policy parity is checked by:

```bash
pnpm platform-admin:policy-parity
```

The root command also runs parity checks:

```bash
pnpm platform-admin:check
```

The smoke compares:

```txt
frontend platform admin allowed roles
backend internal monitoring allowed roles
sidebar required permission
App route guard capability
```

Expected allowlist for this phase:

```txt
OWNER
ADMIN
```

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

Status: Done.

Implemented:

```txt
- frontend platform admin capability policy
- OWNER/ADMIN allowlist for platform-admin.internal-monitoring.read
- PlatformAdminRoute wrapper around ROUTES.INTERNAL_MONITORING
- forbidden panel for non-platform-admin roles
- static guard checks for frontend policy + route wrapper
```

### IM-6 - Sidebar permission isolation

Status: Done.

Implemented:

```txt
- V3PermissionKey includes platform-admin.internal-monitoring.read
- permission compatibility maps platform-admin.internal-monitoring.read to OWNER/ADMIN only
- Internal Monitor sidebar entry uses platform-admin.internal-monitoring.read
- Internal Monitor sidebar entry no longer uses settings.manage
- static guard checks sidebar permission isolation
```

### IM-7 - Policy parity smoke and hardening

Status: Done.

Implemented:

```txt
- standalone policy parity smoke script
- root command pnpm platform-admin:policy-parity
- root command pnpm platform-admin:check runs parity smoke
- parity compares frontend policy, backend policy, sidebar permission, and App route capability
- expected allowlist remains OWNER/ADMIN
```

### IM-8 - Internal Monitoring UX hardening

Next.

Improve dashboard UI states for restricted/read-only/fallback data:

```txt
- clearer read-only banner
- policy badge in dashboard header
- backend source summary
- empty/degraded state copy
- manual smoke checklist for OWNER/ADMIN vs denied roles
```
