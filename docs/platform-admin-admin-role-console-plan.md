# Platform Admin - Admin Role Console Plan

## 1. Scope

Dashboard scope:

```txt
/dashboard/internal/admin-role-console
```

This dashboard is the next Platform Admin console after Internal Monitoring. It is intentionally scoped as a read-only, mock-backed access governance console for portfolio visibility and future implementation planning.

It does not implement real role assignment, role revocation, permission template persistence, audit writes, approval workflows, backend write handlers, or Prisma schema changes in this dashboard phase.

## 2. Rollout style

Admin Role Console follows the same staged style as Internal Monitoring:

```txt
AR-1 - Read-only access guard and scope isolation
AR-2 - Frontend data source adapter and section fallback
AR-3 - UX hardening and read-only safety copy
AR-4 - Browser smoke for platform admin access
AR-5 - Final QA checklist
```

Backend read APIs are not the next phase. Backend work can be discussed later only after the frontend scope, fallback behavior, and smoke coverage are stable.

## 3. Current phase

### AR-1 - Read-only access guard and scope isolation

Status: Done

Implemented guardrails:

- dedicated frontend capability: `platform-admin.admin-role-console.read`
- allowed frontend roles: `OWNER`, `ADMIN`
- sidebar entry requires `platform-admin.admin-role-console.read`
- route page wraps the console in `PlatformAdminRoute`
- dashboard remains mock-backed
- no backend API implementation
- no Prisma schema changes
- no internal admin write route
- no role assignment mutation
- no role revocation mutation
- no permission template mutation
- no audit write
- no approval execution

## 4. What the dashboard shows

The current console displays mock-backed planning views for:

- Admin role overview
- Internal admin metrics
- Access review workflow planning
- Read-only rollout preview
- Readiness map
- Implementation plan
- Schema candidates
- Sensitive action dry-run rows

Current mock source:

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-consoles.mock.ts
```

Current route wrapper:

```txt
artifacts/pos-system/src/pages/dashboard/admin-role-console.tsx
```

## 5. Read-only boundary

This phase must stay read-only. The console may show future role operations as mock rows only.

Blocked in AR-1:

```txt
role assignment execution
role revocation execution
permission template write
approval execution
audit write
Prisma schema promotion
```

Draft read surfaces may appear as mock readiness rows, but they are not implemented as backend handlers in AR-1.

## 6. Promotion requirements for future real data

Before the Admin Role Console can move beyond mock-backed read-only mode, the project must add:

- frontend data source adapter with per-section fallback
- source badge for mock/fallback/API state
- section-level loading/error handling
- static guard for read-only copy and blocked write controls
- browser smoke for OWNER/ADMIN access and MANAGER denial
- final QA checklist for this dashboard

Backend read implementation may be proposed after those gates. Write workflows remain out of scope until RBAC, audit, approval policy, rollback, and rate-limit rules exist.

## 7. Validation command

Run:

```bash
pnpm platform-admin:admin-role-check
pnpm platform-admin:check
```

AR-1 is considered valid only if both pass.

## 8. Next safe phase

Next safe phase:

```txt
AR-2 - Admin Role Console frontend data source adapter and section fallback
```

AR-2 should add a frontend data source module, mock/fallback source metadata, and section-level fallback behavior. It should not add backend endpoints, role mutation, audit writes, approval execution, or Prisma schema promotion yet.
