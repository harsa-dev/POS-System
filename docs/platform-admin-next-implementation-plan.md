# Platform Admin - Next Implementation Plan

## Scope

This plan covers the Platform Admin / Internal Admin console area.

The current Platform Admin screens are mock-first and sensitive. Do not promote mutations, Prisma schema, billing writes, tenant suspension, support resets, role elevation, audit exports, or approval decisions until guardrails are implemented.

Current active scope:

```txt
/dashboard/internal-monitoring
```

Do not implement all Platform Admin dashboards at once. Work dashboard-by-dashboard.

## Related docs

```txt
docs/platform-admin-internal-monitoring-dashboard-plan.md
docs/v3/internal-admin-consoles-route-phase.md
docs/v3/internal-monitoring-dashboard-plan.md
docs/v3/internal-monitoring-control-room-phase.md
docs/12-error-tracking-logs.md
docs/13-monitoring-alerts.md
```

## Related frontend files

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-console-page.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-consoles.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-backend-readiness-panel.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-implementation-plan-panel.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-dashboard.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-contracts.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-upgrade.mock.ts
artifacts/pos-system/src/pages/dashboard/platform-monitoring.tsx
artifacts/pos-system/src/pages/dashboard/admin-role-console.tsx
artifacts/pos-system/src/pages/dashboard/billing-operations-console.tsx
artifacts/pos-system/src/pages/dashboard/operator-support-console.tsx
artifacts/pos-system/src/pages/dashboard/admin-action-audit-console.tsx
artifacts/pos-system/src/pages/dashboard/approval-control-console.tsx
artifacts/pos-system/src/constants/routes.ts
artifacts/pos-system/src/App.tsx
artifacts/pos-system/src/app/registry/core-modules.ts
artifacts/pos-system/src/app/registry/permission-compat.ts
```

## Existing platform admin routes

```txt
/dashboard/internal-monitoring
/dashboard/internal/admin-role-console
/dashboard/internal/billing-operations-console
/dashboard/internal/operator-support-console
/dashboard/internal/admin-action-audit-console
/dashboard/internal/approval-control-console
```

## Current risk assessment

The current implementation is UI/mock-heavy and has useful planning data, but the access boundary is not strict enough for future real admin features.

Observed risks:

1. Internal routes are protected by auth, but no dedicated Platform Admin route guard exists yet.
2. Sidebar entries are under `settings.manage`, which is too broad for future platform admin access.
3. Mock contracts include future POST/PATCH endpoints, but no explicit runtime blocker exists in code.
4. Internal admin roles such as `SUPER_ADMIN`, `BILLING_ADMIN`, and `SUPPORT_OPS_ADMIN` exist only as mock concepts.
5. No frontend static check currently blocks accidental admin mutation wiring.
6. No backend `/api/internal/*` route should be added until read-only guard policy is documented and checked.

## Sensitive rules

Non-negotiable rules:

```txt
1. Platform Admin starts read-only.
2. No POST/PATCH/DELETE implementation in Platform Admin phase 1.
3. No Prisma schema promotion in Platform Admin phase 1.
4. No tenant suspension, billing refund, role elevation, support reset, approval decision, or audit export mutation.
5. Every future action must have RBAC, audit event, approval policy, rollback note, and rate limit plan.
6. Platform Admin access must not depend only on business mode.
7. Platform Admin must not mutate Restaurant/Retail/Raw Material operational data.
```

## Dashboard-scoped implementation phases

### IM-1 - Internal Monitoring dashboard spec + static guard

Status: Done.

Implemented:

```txt
docs/platform-admin-internal-monitoring-dashboard-plan.md
scripts/platform-admin-internal-monitoring-check.mjs
pnpm platform-admin:check
```

Static check verifies:

```txt
- Internal Monitoring dashboard plan exists
- dashboard route constants exist
- App route is mounted
- current UI remains mock-backed
- current docs still describe mock-first/read-only scope
- no frontend /api/internal/* POST/PATCH/DELETE wiring exists
- no backend /api/internal/* POST/PATCH/DELETE route wiring exists
```

Validation:

```bash
pnpm platform-admin:check
pnpm business-mode:check
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

### IM-2 - Internal Monitoring frontend data source adapter

Goal: keep the current dashboard UI but prepare it for API-backed read-only data.

Tasks:

1. Add `internal-monitoring-data-source.ts`.
2. Support source modes:
   - `mock`
   - `api`
   - `fallback`
3. Add generatedAt/source badge.
4. Keep API optional and fallback to mock if backend route is unavailable.
5. No mutation buttons.

### IM-3 - Backend read-only route scaffold

Only after IM-1 and IM-2.

Allowed GET endpoints:

```txt
GET /api/internal/health/summary
GET /api/internal/routes/inventory
GET /api/internal/contracts/readiness
GET /api/internal/data-integrity/checks
```

Rules:

- GET only.
- Auth guard required.
- Capability guard required.
- Consistent response envelope.
- No Prisma mutation.
- Mock repository allowed.

### IM-4 - Frontend API client integration

Add:

```txt
artifacts/pos-system/src/lib/api/internal-monitoring-api.ts
```

Allowed methods:

```txt
internalMonitoringApi.getHealthSummary()
internalMonitoringApi.getRouteInventory()
internalMonitoringApi.getContractReadiness()
internalMonitoringApi.getDataIntegrityChecks()
```

### IM-5 - Platform Admin route guard

Add dedicated guard for `/dashboard/internal-monitoring`.

Temporary policy:

```txt
OWNER and ADMIN may view.
MANAGER, OPERATOR, STAFF, VIEWER should not get future platform admin action access.
```

Future capability:

```txt
platform-admin.internal-monitoring.read
```

### IM-6 - Sidebar permission isolation

Move Internal Monitoring sidebar entry away from broad `settings.manage` and into `platform-admin.internal-monitoring.read`.

### IM-7 - Optional persistence design

Only design persistent probe storage. Do not implement Prisma models until read-only API usage proves persistence is needed.

## Paused broader Platform Admin phases

These remain paused until Internal Monitoring is stable:

```txt
PA-2 - Dedicated Platform Admin frontend route guard for all consoles
PA-3 - Sidebar isolation for all Platform Admin consoles
PA-4 - Read-only API contract freeze for all Platform Admin consoles
PA-5 - Backend read-only scaffold for all consoles
PA-6 - Mutation readiness design, not implementation
```

## Recommended next implementation

Start with:

```txt
IM-2 - Internal Monitoring frontend data source adapter
```

Do not start from mutation endpoints, Prisma models, alert acknowledgement, billing actions, tenant actions, or role elevation.
