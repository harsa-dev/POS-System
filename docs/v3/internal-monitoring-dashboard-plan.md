# Internal Monitoring Dashboard Plan

This document prepares a UI-only monitoring dashboard for project owner, super admin, and development review.

The dashboard is intentionally built as a **mock-first internal control room**. It should help the project owner inspect route ownership, shared dashboard growth, API readiness, schema risk, release gates, refactor incidents, rollout phase, access policy, and observability targets before real backend work starts.

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
- API rollout plan
- response envelope examples
- schema promotion backlog
- internal access policy matrix
- observability target matrix
- manual runbook steps
- dashboard page scaffold
- route constant preparation

No Prisma schema update is allowed in this phase.

## Existing Files Added

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-contracts.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-dashboard.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/dev-monitoring-deep-dive.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-upgrade.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-upgrade-board.tsx
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

## API Rollout Plan

The rollout path must stay conservative:

1. **Mock UI**: dashboard renders from `*.mock.ts` files only.
2. **Read-only API**: add GET handlers that return the same response envelope as the mocks.
3. **Persisted monitoring**: add Prisma models only if historical tracking is actually needed.
4. **Automated checks**: add scheduled probes or CI checks only after manual gates are stable.

Mutation endpoint `/api/internal/alerts/:alertId/acknowledge` must stay blocked until permission guard and audit logging are stable.

## API Response Envelope

Every future endpoint must use a consistent envelope:

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
    generatedAt?: string;
    mock?: boolean;
    source?: string;
  };
};
```

Success example:

```json
{
  "success": true,
  "data": {
    "summary": { "status": "Warning", "critical": 1 },
    "generatedAt": "mock-iso-date"
  },
  "meta": { "mock": true, "source": "internal-monitoring" }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_MONITOR_FORBIDDEN",
    "message": "You do not have access to internal monitoring."
  },
  "meta": { "mock": false }
}
```

## Future API Implementation Rules

When API phase starts:

1. Create read-only handlers first.
2. Keep mutation endpoint `/api/internal/alerts/:alertId/acknowledge` blocked until auth and audit logging are stable.
3. Validate every query/body with schema validation.
4. Return the consistent response envelope above.
5. Never let this dashboard mutate restaurant POS, kitchen, serving, orders, payments, inventory, or payroll data.

## Future Schema Candidates

Only candidates. Do not add yet.

| Model | Purpose | Phase | Risk |
|---|---|---:|---:|
| `InternalSystemProbe` | Persist periodic service checks if health monitoring needs history. | Phase 2 | Low |
| `InternalAlert` | Store platform warnings, acknowledgements, and ownership. | Phase 3 | Medium |
| `InternalRouteSnapshot` | Snapshot route inventory if route registry becomes dynamic. | Optional | Low |
| `FeatureFlagSnapshot` | Track enabled/disabled platform features per tenant/mode. | Phase 4 | High |

## Schema Promotion Backlog

Schema candidate promotion must be backed by a real product reason:

| Model | Promote when | Blocked by | Acceptance |
|---|---|---|---|
| `InternalSystemProbe` | Health summary needs history, trends, or incident correlation. | No read-only health handler yet. | GET health endpoint exists, build passes, and probe payload is validated. |
| `InternalAlert` | Internal warnings need acknowledgement and ownership history. | Audit log write path and permission guard must be stable first. | Acknowledge action writes audit event and cannot touch POS operational data. |
| `FeatureFlagSnapshot` | Business modes need per-tenant feature rollout tracking. | Tenant model and business mode registry are not final enough. | Feature flags have a clear owner, rollback strategy, and tenant boundary. |

## Schema Promotion Rules

Schema candidates can only become real Prisma models when:

1. UI mock is stable.
2. Route is wired and visible only to allowed roles.
3. Read-only API contract is implemented.
4. Typecheck and production build pass.
5. There is a real reason to persist the data.
6. Migration plan includes rollback notes.

## Access Policy

Initial policy:

| Role | Can view | Can act | Blocked actions |
|---|---|---|---|
| OWNER | Yes, own tenant/project workspace. | Read-only during UI phase. | Alert acknowledgement, schema mutation, operational data mutation. |
| MANAGER | Optional later, disabled by default. | No. | All internal actions. |
| SUPER_ADMIN future | Yes, across tenants when role exists. | Later: acknowledge internal alerts only. | Schema changes, data repair mutation, payment/order mutation. |

## Observability Targets

| Metric | Source | Threshold | Future endpoint |
|---|---|---|---|
| Route Wiring Coverage | `ROUTES` constant + App router + sidebar registry | 100% active internal routes render without console crash. | `/api/internal/routes/inventory` |
| Schema Drift | `git diff -- prisma/schema.prisma` | 0 Prisma diff during UI-only phases. | `/api/internal/data-integrity/checks` |
| Contract Readiness | `internalApiContracts` | Every endpoint defines auth, request, response, and errors. | `/api/internal/contracts/readiness` |

## Runbook

Manual runbook before backend/schema promotion:

1. Route smoke test: open direct URL, refresh page, then navigate from sidebar.
2. Contract freeze: lock request/response shape in docs and mock file before handler implementation.
3. Schema promotion review: write model purpose, indexes, rollback notes, and risk before editing Prisma.

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
- API rollout board renders
- response envelope examples render
- schema candidate cards render
- schema promotion backlog renders
- route ownership matrix renders
- access policy matrix renders
- observability target matrix renders
- no Prisma schema diff in UI-only phase
- no mutation endpoint is called

## Rules

- Keep this dashboard UI-only until backend phase.
- Do not touch restaurant POS, kitchen, serving, orders, payments, tables, menu, or recipes.
- Do not create migrations yet.
- Use the dashboard to validate visibility, route ownership, mock data shape, and future API contracts.
- Treat this dashboard as a project owner/dev control room, not a customer-facing feature.
