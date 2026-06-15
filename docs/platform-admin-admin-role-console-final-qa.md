# Platform Admin - Admin Role Console Final QA

## Scope

This checklist closes the current Admin Role Console dashboard scope only:

```txt
/dashboard/internal/admin-role-console
```

This QA does not certify Billing Operations Console, Support/Ops Console, Admin Action Audit, or Sensitive Action Approval.

## Scope status

Current status:

```txt
frontend route guard: implemented
sidebar permission isolation: implemented
frontend data source fallback: implemented
backend read-only scaffold: implemented
browser smoke: implemented
final QA: this document
```

Still out of scope:

```txt
database access
Prisma schema changes
management mutation execution
audit write execution
approval execution
```

## Command gate

Run from the repository root:

```bash
pnpm platform-admin:admin-role-check
pnpm platform-admin:admin-role-final-qa
pnpm platform-admin:check
pnpm platform-admin:policy-parity
pnpm platform-admin:contract-parity
pnpm business-mode:check
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Optional browser smoke when Playwright and the frontend dev server are available:

```bash
pnpm platform-admin:admin-role-browser-smoke
```

## Manual smoke matrix

### OWNER / ADMIN

Expected:

```txt
/dashboard/internal/admin-role-console renders
sidebar shows Admin Role Console
Read-only Operation Notice is visible
Allowed Surface shows GET only
Source badge is visible
Read-only Safety Boundary is visible
Section Source Health is visible
Console Metrics is visible
Console Workflows is visible
Read-only Rollout Preview is visible
Schema Candidates is visible
```

### Non-platform admin roles

For non-platform admin roles, expected:

```txt
Platform Admin Restricted is visible
platform-admin.admin-role-console.read is referenced
Admin Role Console must not render management controls
```

## Backend boundary

Allowed backend surface:

```txt
GET /api/internal/admin-console/roles
```

The backend route must remain read-only, policy guarded, and backed by the Admin Role Console service/mock repository until a real permission registry source is designed.

Blocked backend surface:

```txt
POST /api/internal/admin-console/*
PATCH /api/internal/admin-console/*
DELETE /api/internal/admin-console/*
```

## Frontend boundary

The frontend loader must keep this order:

```txt
1. Try read-only backend API.
2. If backend succeeds, show API source state.
3. If backend fails, use frontend fallback data.
4. Keep every section read-only.
5. Never expose management controls in this scope.
```

Required frontend files:

```txt
artifacts/pos-system/src/pages/dashboard/admin-role-console.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-console-page.tsx
artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-console-data-source.ts
artifacts/pos-system/src/lib/api/admin-role-console-api.ts
```

Required backend files:

```txt
artifacts/api-server/src/routes/admin-role-console.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.types.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.policy.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console-response.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.service.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.mock-repository.ts
```

## Browser smoke expectations

The browser smoke must validate:

```txt
ADMIN can render the dashboard
MANAGER is denied by Platform Admin Restricted
Read-only Operation Notice is visible
Allowed Surface is visible
Source badge is visible
Read-only Safety Boundary is visible
Section Source Health is visible
Console Metrics is visible
Console Workflows is visible
Read-only Rollout Preview is visible
Schema Candidates is visible
No management mutation controls are visible
```

## Handoff note

Admin Role Console is ready for validation and handoff as a read-only dashboard with backend read-only mock data and frontend fallback.

The next Platform Admin dashboard should start from the same staged flow:

```txt
scope
access guard
frontend data source
backend read-only scaffold
UX hardening
browser smoke
final QA
```
