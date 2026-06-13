# Internal Monitoring Dashboard Plan

This document prepares a UI-only monitoring dashboard for project owner, super admin, and development review.

The dashboard is intentionally built as a **mock-first internal control room**. It should help the project owner inspect route ownership, shared dashboard growth, API readiness, schema risk, release gates, and refactor incidents before real backend work starts.

## Current Scope

Implemented as preparation only:

- mock service health data
- mock business mode snapshot
- mock task queue
- mock API readiness list
- detailed internal API contract matrix
- route ownership matrix
- schema candidate map
- data integrity checks
- release gates
- incident timeline mock
- dashboard page scaffold
- route constant preparation

No Prisma schema update is allowed in this phase.

## Existing Files Added

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-contracts.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-dashboard.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-deep-dive.tsx
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

## Future API Contract Matrix

These endpoints are planning contracts only. Do not create handlers yet unless the backend phase explicitly starts.

| Domain | Method | Endpoint | Auth | Request | Response | Error states | Source mock |
|---|---:|---|---|---|---|---|---|
| Platform Health | GET | `/api/internal/health/summary` | OWNER/SUPER_ADMIN | `tenantId?`, `mode?`, `includeMock?` | `{ summary, services[], incidents[], generatedAt }` | 401, 403, 503 | `devServiceHealthMocks` |
| Route Inventory | GET | `/api/internal/routes/inventory` | OWNER/SUPER_ADMIN | `group?`, `status?`, `mode?` | `{ routes[], totals }` | 401, 403 | `internalRouteOwnershipMocks` |
| API Contract Registry | GET | `/api/internal/contracts/readiness` | OWNER/SUPER_ADMIN | `domain?`, `readiness?`, `owner?` | `{ contracts[], countsByReadiness, generatedAt }` | 401, 403 | `internalApiContracts` |
| Data Integrity | GET | `/api/internal/data-integrity/checks` | OWNER/SUPER_ADMIN | `scope?`, `severity?` | `{ checks[], failedCount, warningCount, generatedAt }` | 401, 403, 500 | `internalDataIntegrityChecks` |
| Internal Alerts | PATCH | `/api/internal/alerts/:alertId/acknowledge` | OWNER/SUPER_ADMIN | `{ note?, nextAction? }` | `{ alert, acknowledgedBy, acknowledgedAt }` | 400, 401, 403, 404 | `internalIncidentMocks` |

## Future API Implementation Rules

When API phase starts:

1. Create read-only handlers first.
2. Keep mutation endpoint `/api/internal/alerts/:alertId/acknowledge` blocked until auth and audit logging are stable.
3. Validate every query/body with schema validation.
4. Return consistent response envelope:

```ts
type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    generatedAt: string;
    mock?: boolean;
  };
};
```

5. Never let this dashboard mutate restaurant POS, kitchen, serving, orders, payments, inventory, or payroll data.

## Future Schema Candidates

Only candidates. Do not add yet.

| Model | Purpose | Phase | Risk |
|---|---|---:|---:|
| `InternalSystemProbe` | Persist periodic service checks if health monitoring needs history. | Phase 2 | Low |
| `InternalAlert` | Store platform warnings, acknowledgements, and ownership. | Phase 3 | Medium |
| `InternalRouteSnapshot` | Snapshot route inventory if route registry becomes dynamic. | Optional | Low |
| `FeatureFlagSnapshot` | Track enabled/disabled platform features per tenant/mode. | Phase 4 | High |

## Schema Promotion Rules

Schema candidates can only become real Prisma models when:

1. UI mock is stable.
2. Route is wired and visible only to allowed roles.
3. Read-only API contract is implemented.
4. Typecheck and production build pass.
5. There is a real reason to persist the data.
6. Migration plan includes rollback notes.

## Release Gates

Before merging backend/schema work for this dashboard:

```bash
pnpm typecheck
pnpm build
git diff -- prisma/schema.prisma
```

Manual smoke test:

```txt
/dashboard/internal-monitoring
```

Expected result:

- page renders
- service health table renders
- contract matrix renders
- schema candidate cards render
- route ownership matrix renders
- no Prisma schema diff in UI-only phase
- no mutation endpoint is called

## Rules

- Keep this dashboard UI-only until backend phase.
- Do not touch restaurant POS, kitchen, serving, orders, payments, tables, menu, or recipes.
- Do not create migrations yet.
- Use the dashboard to validate visibility, route ownership, mock data shape, and future API contracts.
- Treat this dashboard as a project owner/dev control room, not a customer-facing feature.
