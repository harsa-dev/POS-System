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

The route is mounted in `artifacts/pos-system/src/App.tsx` and must use a dedicated Platform Admin guard.

## Advanced dashboard sections

```txt
1. Executive System Summary
2. Service Health Monitor
3. Business Mode Runtime Snapshot
4. Route Ownership Matrix
5. API Contract Readiness
6. Data Integrity Checks
7. Mutation Readiness & Dry-run Contracts
8. Schema Candidate / Migration Risk
9. Release Gates
10. Incident Timeline / Internal Alerts
11. Dev Action Queue
12. Observability Targets
```

## Backend read-only endpoint plan

Allowed in first backend scaffold:

```txt
GET /api/internal/health/summary
GET /api/internal/routes/inventory
GET /api/internal/contracts/readiness
GET /api/internal/data-integrity/checks
GET /api/internal/mutation-readiness/contracts
```

Blocked until later phases:

```txt
POST /api/internal/*
PATCH /api/internal/*
DELETE /api/internal/*
PATCH /api/internal/alerts/:alertId/acknowledge
```

Alert acknowledgement must stay blocked until dedicated RBAC, audit logging, approval policy, rollback notes, and rate limits are implemented.

## Mutation readiness and dry-run contract

IM-10 adds a read-only mutation readiness catalog. It is not an executor.

The catalog lists future mutation candidates and their required controls:

```txt
required capability
required audit event
required approval policy
rollback plan
rate limit
blocked reason
required proof
dry-run requirement
```

Current catalog endpoint:

```txt
GET /api/internal/mutation-readiness/contracts
```

Proposed future mutation endpoints may appear as strings inside the catalog, but no POST/PATCH/DELETE route or API client call may be implemented in this phase.

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

This must replace broad `settings.manage` for the Internal Monitoring sidebar entry in a later phase.

## Optional browser smoke

Internal Monitoring has an optional browser smoke command:

```bash
pnpm platform-admin:browser-smoke
```

Environment:

```txt
PLATFORM_ADMIN_APP_URL=http://localhost:5173
PLATFORM_ADMIN_SMOKE_COOKIE=<browser cookie for real authenticated checks>
PLATFORM_ADMIN_SMOKE_HEADLESS=false
PLATFORM_ADMIN_SMOKE_SKIP_AUTH=true
PLATFORM_ADMIN_SMOKE_USE_MOCK_AUTH=true
```

Default smoke uses mocked `/api/auth/me` responses to simulate ADMIN allow and MANAGER deny without needing real accounts. Set `PLATFORM_ADMIN_SMOKE_USE_MOCK_AUTH=false` and provide a cookie when validating against real auth.

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

Status: Done.

Implemented:

```txt
- read-only safety banner
- source health summary panel
- quick section navigation
- clearer GET-only and capability badges
- aria-live source/fallback status copy
- observability-only promotion checklist item
- static guard checks UX hardening elements
```

### IM-9 - Internal Monitoring browser smoke

Status: Done.

Implemented:

```txt
- optional Playwright browser smoke script
- root command pnpm platform-admin:browser-smoke
- mock-auth ADMIN allow smoke
- mock-auth MANAGER forbidden smoke
- read-only banner, source health, quick nav, route inventory, and data integrity visibility checks
- no internal mutation controls visible check
- static guard checks browser smoke contract
```

### IM-10 - Mutation readiness design and dry-run contract

Status: Done.

Implemented:

```txt
- backend mutation readiness contract catalog
- GET /api/internal/mutation-readiness/contracts endpoint
- frontend API client method for mutation readiness catalog
- adapter fallback for mutation readiness contracts
- Mutation Readiness & Dry-run Contracts dashboard panel
- static guard checks endpoint, service, UI panel, and required controls
- no real mutation route, API client mutation, Prisma schema, or alert acknowledgement implementation
```

### IM-11 - Internal Monitoring typecheck cleanup and extraction

Next.

Extract PlatformAdminRoute out of App and tighten frontend/backend DTO reuse so the dashboard can grow without turning App.tsx into a wiring landfill.
