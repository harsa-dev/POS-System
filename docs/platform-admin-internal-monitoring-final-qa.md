# Platform Admin Internal Monitoring - Final QA Checklist

## Scope

This checklist closes the current dashboard-scoped Internal Monitoring work.

```txt
/dashboard/internal-monitoring
```

It does not certify the other Platform Admin consoles.

## Required command gate

Run these commands before handing off this scope:

```bash
pnpm platform-admin:check
pnpm platform-admin:policy-parity
pnpm platform-admin:contract-parity
pnpm business-mode:check
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Optional browser smoke:

```bash
pnpm platform-admin:browser-smoke
```

If Playwright is not installed:

```bash
pnpm add -D playwright
pnpm exec playwright install chromium
```

## Runtime manual smoke

### OWNER / ADMIN

```txt
1. Login as OWNER or ADMIN.
2. Open /dashboard/internal-monitoring.
3. Dashboard must render.
4. Runtime Status panel must render.
5. Runtime Mode, Freshness, Section Coverage, and Guardrail cards must render.
6. Read-only internal monitoring safety banner must render.
7. Source Health Summary must render.
8. Route Inventory panel must render.
9. API Implementation Blueprint panel must render.
10. Data Integrity Checks panel must render.
11. Mutation Readiness & Dry-run Contracts panel must render.
12. Refresh Source must not expose mutation behavior.
```

### MANAGER / OPERATOR / STAFF / VIEWER

```txt
1. Login as MANAGER, OPERATOR, STAFF, or VIEWER.
2. Open /dashboard/internal-monitoring directly.
3. Platform Admin Restricted panel must render.
4. Sidebar must not expose Internal Monitor.
5. API calls to /api/internal/* must return forbidden unless backend policy says otherwise.
```

## Read-only guardrail

The following remain blocked in this phase:

```txt
POST /api/internal/*
PATCH /api/internal/*
DELETE /api/internal/*
PATCH /api/internal/alerts/:alertId/acknowledge
Prisma model promotion for InternalSystemProbe
Prisma model promotion for InternalAlert
Tenant suspension
Billing refund
Role elevation
Support reset
Audit export mutation
Schema candidate promotion mutation
```

## Contract gate

The machine-readable snapshot must remain the source of contract parity for this dashboard:

```txt
docs/platform-admin-internal-monitoring-contract-snapshot.json
```

The snapshot must cover:

```txt
route
capability
allowed roles
GET endpoints
response envelope fields
frontend DTO fields
backend DTO fields
dashboard sections
blocked mutations
mutation readiness design-only state
```

## Policy parity gate

The following surfaces must agree on the same capability and role allowlist:

```txt
Frontend platform admin policy
Backend internal monitoring policy
Sidebar required permission
App route guard
Contract snapshot
```

Expected capability:

```txt
platform-admin.internal-monitoring.read
```

Expected allowed roles:

```txt
OWNER
ADMIN
```

## Browser smoke expectations

`pnpm platform-admin:browser-smoke` should validate:

```txt
ADMIN can render Internal Monitoring
MANAGER sees Platform Admin Restricted
Read-only banner renders
Runtime Status panel renders
Runtime Mode card renders
Freshness card renders
Section Coverage card renders
Guardrail card renders
Route Inventory renders
Data Integrity Checks renders
No internal mutation controls are visible
```

## Handoff status

Internal Monitoring is ready for the next safe scope only after the required command gate passes.

Recommended next safe scope:

```txt
Choose the next Platform Admin dashboard one dashboard at a time.
Do not promote real platform mutations yet.
Do not expand beyond read-only backend surfaces until audit, approval, rollback, rate-limit, and dry-run contracts are implemented.
```
