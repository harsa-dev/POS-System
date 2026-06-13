# Internal Monitoring Dashboard Plan

This document prepares a UI-only monitoring dashboard for project owner, super admin, and development review.

## Current Scope

Implemented as preparation only:

- mock service health data
- mock business mode snapshot
- mock task queue
- mock API readiness list
- mock schema preparation notes
- dashboard page scaffold
- route constant preparation

No Prisma schema update is allowed in this phase.

## Existing Files Added

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-dashboard.tsx
artifacts/pos-system/src/pages/dashboard/platform-monitoring.tsx
```

## Current Route Constant

```ts
INTERNAL_MONITORING: "/dashboard/internal-monitoring"
```

## Pending Wiring

The dashboard still needs App route wiring if not already added by another agent:

```ts
const InternalMonitoringPage = lazy(() => import("@/pages/dashboard/platform-monitoring"));
```

Then add inside protected routes:

```tsx
<Route path={ROUTES.INTERNAL_MONITORING}><InternalMonitoringPage /></Route>
```

## Pending Sidebar Entry

Recommended registry location: `coreModules`, inside the existing `settings` metadata as a sidebar entry.

```ts
{
  moduleId: "settings",
  label: "Internal Monitor",
  description: "UI-only monitoring dashboard for service health, mode snapshot, route ownership, API readiness, and schema planning.",
  routePath: ROUTES.INTERNAL_MONITORING,
  group: "Core Systems",
  supportedModes: allModes,
  requiredPermissions: ["settings.manage"],
  featureFlags: [],
  order: 8,
}
```

## Future API Contract Draft

Potential endpoints:

```txt
GET /api/internal/health
GET /api/internal/modes/summary
GET /api/internal/tasks
PATCH /api/internal/alerts/:id/ack
```

## Future Schema Candidates

Only candidates. Do not add yet.

```txt
InternalSystemProbe
InternalAlert
TenantModeSnapshot
```

## Rules

- Keep this dashboard UI-only until backend phase.
- Do not touch restaurant POS, kitchen, serving, orders, payments, tables, menu, or recipes.
- Do not create migrations yet.
- Use the dashboard to validate visibility, route ownership, mock data shape, and future API contracts.
