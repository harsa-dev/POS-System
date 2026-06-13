# Internal Monitoring Control Room Phase

This phase upgrades the internal monitoring dashboard from a static readiness page into a more complete owner/developer control room.

## Scope Completed

Implemented in this phase:

- route wiring for `/dashboard/internal-monitoring`
- sidebar registry entry under the existing `settings` core module
- typed mock control room data
- runtime signal table
- API implementation blueprint table
- schema decision records
- developer action queue
- promotion checklist

No Prisma schema or backend handler was added.

## Files Added

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/internal-monitoring-control-room.tsx
```

## Files Updated

```txt
artifacts/pos-system/src/pages/dashboard/platform-monitoring.tsx
artifacts/pos-system/src/App.tsx
artifacts/pos-system/src/app/registry/core-modules.ts
```

## Current Route

```txt
/dashboard/internal-monitoring
```

## Sidebar Entry

The internal monitor is exposed through `coreModules`, inside the existing `settings` metadata.

```ts
{
  moduleId: "settings",
  label: "Internal Monitor",
  routePath: ROUTES.INTERNAL_MONITORING,
  group: "Core Systems",
  requiredPermissions: ["settings.manage"]
}
```

This avoids creating a new module id before the core registry is ready for a dedicated internal/admin module.

## API Implementation Blueprint

The control room now tracks endpoint promotion from mock to API:

| Phase | Endpoint | Status | Rule |
|---|---|---|---|
| Phase 1 | `GET /api/internal/health/summary` | Ready | Read-only aggregate only. |
| Phase 1 | `GET /api/internal/contracts/readiness` | Ready | Return contract state, no mutation. |
| Phase 2 | `GET /api/internal/data-integrity/checks` | Draft | Cheap checks only. Avoid slow DB scans. |
| Phase 3 | `PATCH /api/internal/alerts/:alertId/acknowledge` | Blocked | Requires permission guard and audit append first. |

## Schema Decision Records

Schema is still locked. Current decisions:

| Candidate | Decision | Required proof |
|---|---|---|
| `InternalSystemProbe` | Prepare | At least two releases need historical uptime trend data. |
| `InternalAlert` | Hold | Acknowledge flow has auth guard, audit trail, and UI confirmation. |
| `FeatureFlagSnapshot` | Promote Later | At least three flags are read from API and shown in dashboard. |

## Release Gates

Before backend/schema phase:

```bash
cd artifacts/pos-system
pnpm typecheck
pnpm build
git diff -- prisma/schema.prisma
```

Expected result:

- `/dashboard/internal-monitoring` renders without 404
- sidebar entry appears for users with `settings.manage`
- mock dashboard sections render
- no Prisma schema diff
- no write endpoint is called

## Hard Rules

- Keep this dashboard UI/mock-only until backend phase.
- Promote GET endpoints before any PATCH/POST action.
- Do not mutate restaurant POS, kitchen, serving, orders, payments, inventory, payroll, or customer data.
- Do not add Prisma models until a real persistence need is proven.
- Keep mock data in `*.mock.ts`, not buried inside JSX.
