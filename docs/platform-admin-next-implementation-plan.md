# Platform Admin - Next Implementation Plan

## Scope

This plan covers the Platform Admin / Internal Admin console area.

The current Platform Admin screens are mock-first and sensitive. Do not promote mutations, Prisma schema, billing writes, tenant suspension, support resets, role elevation, audit exports, or approval decisions until guardrails are implemented.

## Related docs

```txt
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

## Implementation phases

### PA-1 - Platform Admin boundary docs + static guard

Goal: make Platform Admin explicitly sensitive and block accidental mutation rollout.

Tasks:

1. Keep this plan doc updated.
2. Add `scripts/platform-admin-check.mjs`.
3. Add root command `pnpm platform-admin:check`.
4. Static check must verify:
   - internal admin docs exist
   - internal admin mock file still says blocked/read-only for mutations
   - no frontend API client calls `apiClient.post`, `apiClient.patch`, or `apiClient.delete` for `/api/internal/*`
   - no backend route file exposes `/api/internal/*` mutation endpoints yet
   - Platform Admin route constants exist
   - Platform Admin pages remain under mock files

Validation:

```bash
pnpm platform-admin:check
pnpm business-mode:check
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

### PA-2 - Dedicated Platform Admin frontend route guard

Goal: separate Platform Admin access from normal business mode and from broad `settings.manage` sidebar access.

Tasks:

1. Add `platform-admin-policy.ts` or equivalent frontend policy helper.
2. Define `PlatformAdminCapability`:
   - `platform-admin.monitoring.view`
   - `platform-admin.roles.view`
   - `platform-admin.billing.view`
   - `platform-admin.support.view`
   - `platform-admin.audit.view`
   - `platform-admin.approvals.view`
3. Define all action capabilities as planned but disabled:
   - `platform-admin.roles.request-change`
   - `platform-admin.billing.refund-review`
   - `platform-admin.support.request-reset`
   - `platform-admin.audit.export`
   - `platform-admin.approvals.decide`
4. Add `PlatformAdminRouteGuard`.
5. Wrap internal routes in App with this guard.
6. Keep fallback behavior read-only and deny unknown roles.

Acceptance:

```txt
- OWNER can view mock-only internal monitor if allowed by policy.
- Normal staff/operator/viewer cannot see Platform Admin entries.
- No action buttons execute mutations.
```

### PA-3 - Sidebar isolation for Platform Admin

Goal: prevent internal admin entries from being treated as normal business workspace modules.

Tasks:

1. Replace `settings.manage` for internal admin sidebar entries with dedicated platform admin permissions.
2. Move internal admin items to a clearly labeled group, for example `Platform Admin`.
3. Add warning copy: `Internal mock-only tools`.
4. Make route support mode-agnostic but policy-gated.

Acceptance:

```txt
- Restaurant/Retail/Raw Material mode switch does not grant Platform Admin access.
- Internal admin entries appear only to allowed platform admin roles/capabilities.
```

### PA-4 - Read-only API contract freeze

Goal: freeze GET-only contracts before building backend.

Allowed future GET endpoints:

```txt
GET /api/internal/health/summary
GET /api/internal/routes/inventory
GET /api/internal/contracts/readiness
GET /api/internal/data-integrity/checks
GET /api/internal/admin-console/roles
GET /api/internal/billing/operations/overview
GET /api/internal/support/ops/tickets
GET /api/internal/audit/admin-actions
GET /api/internal/approvals/sensitive-actions
```

Blocked until later:

```txt
POST /api/internal/admin-console/role-requests
PATCH /api/internal/approvals/sensitive-actions/:id
PATCH /api/internal/alerts/:alertId/acknowledge
```

### PA-5 - Backend read-only route scaffold

Only after PA-1 to PA-4 are done.

Rules:

- GET only.
- Auth guard required.
- Capability guard required.
- Consistent response envelope.
- No Prisma mutation.
- Mock adapter allowed.
- Audit read can be mock/pending only.

### PA-6 - Mutation readiness design, not implementation

Before any real Platform Admin mutation, write a dedicated design doc with:

```txt
RBAC matrix
approval policy
rate limits
audit event names
rollback strategy
dry-run mode
failure states
operator warning copy
manual emergency stop
```

Do not implement mutation handlers in PA-6.

## Recommended next implementation

Start with:

```txt
PA-1 - Platform Admin boundary docs + static guard
```

Reason:

The files are sensitive. Before adding routes or UI actions, the repo needs a static tripwire so future changes cannot accidentally wire `/api/internal/*` POST/PATCH/DELETE or treat Platform Admin as ordinary business mode settings.
