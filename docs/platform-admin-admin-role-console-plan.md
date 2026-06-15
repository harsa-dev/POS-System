# Platform Admin - Admin Role Console Plan

## 1. Scope

Dashboard scope:

```txt
/dashboard/internal/admin-role-console
```

This dashboard is the next Platform Admin console after Internal Monitoring. It is scoped as a read-only access governance console for portfolio visibility and future implementation planning.

It does not implement real assignment execution, revocation execution, permission template persistence, audit writes, approval workflows, backend write handlers, database access, or Prisma schema changes in this dashboard phase.

## 2. Rollout style

Admin Role Console follows the same staged style as Internal Monitoring:

```txt
AR-1 - Read-only access guard and scope isolation
AR-2 - Frontend data source adapter and section fallback
AR-3 - Backend read-only scaffold and API fallback integration
AR-4 - UX hardening and read-only safety copy
AR-5 - Browser smoke for platform admin access
AR-6 - Final QA checklist
```

Backend work in this scope is read-only only. It may expose GET-only overview data backed by a backend mock repository, but it must not add database writes, Prisma schema changes, or management mutations.

## 3. Current phase

### AR-1 - Read-only access guard and scope isolation

Status: Done

Implemented guardrails:

- dedicated frontend capability: `platform-admin.admin-role-console.read`
- allowed frontend roles: `OWNER`, `ADMIN`
- sidebar entry requires `platform-admin.admin-role-console.read`
- route page wraps the console in `PlatformAdminRoute`
- dashboard remains read-only
- no Prisma schema changes
- no internal admin write route
- no role assignment mutation
- no role revocation mutation
- no permission template mutation
- no audit write
- no approval execution

### AR-2 - Frontend data source adapter and section fallback

Status: Done

Implemented frontend rollout:

- added `admin-role-console-data-source.ts`
- added `AdminRoleConsoleDataSourceResult`
- added source metadata and section fallback state
- added section fallback state for console card, metrics, workflows, rollout preview, and schema candidates
- added dedicated `admin-role-console-page.tsx`
- route now renders the dedicated Admin Role Console page through the data source adapter
- dashboard shows source badge, generated timestamp, section source health, read-only safety boundary, metrics, workflows, rollout preview, and schema candidates
- no database access
- no Prisma schema changes
- no role assignment execution
- no role revocation execution
- no permission template write
- no approval execution
- no audit write

### AR-3 - Backend read-only scaffold and API fallback integration

Status: Done

Implemented backend read-only scaffold:

- added backend DTO types: `admin-role-console.types.ts`
- added backend policy: `admin-role-console.policy.ts`
- added backend response envelope: `admin-role-console-response.ts`
- added backend mock repository: `admin-role-console.mock-repository.ts`
- added backend service: `admin-role-console.service.ts`
- added GET-only route: `GET /api/internal/admin-console/roles`
- mounted the route in `artifacts/api-server/src/routes/index.ts`
- added frontend API client: `admin-role-console-api.ts`
- updated frontend data source to try the read-only API first and fall back to frontend mock data
- updated page source copy to show API/fallback state
- no database access
- no Prisma schema changes
- no role assignment execution
- no role revocation execution
- no permission template write
- no approval execution
- no audit write

### AR-4 - UX hardening and read-only safety copy

Status: Done

Implemented UX hardening:

- added visible `Read-only Operation Notice`
- added source-specific copy through `getSourceCopy`
- added API/fallback state explanation
- added `Fallback State` panel when API or section fallback is active
- added reusable empty-state copy for metrics, workflows, rollout preview, and schema candidates
- kept allowed surface visible as GET-only
- kept write boundary visible as blocked
- kept no database access and no Prisma promotion copy visible

## 4. What the dashboard shows

The current console displays read-only planning views through a backend-first data source with frontend fallback for:

- Admin role overview
- Internal admin metrics
- Access review workflow planning
- Read-only rollout preview
- Section source health
- Read-only safety boundary
- Read-only Operation Notice
- Fallback State when fallback data is active
- Schema candidates

Current frontend fallback source:

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-consoles.mock.ts
```

Current frontend data source adapter:

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-console-data-source.ts
```

Current backend read-only files:

```txt
artifacts/api-server/src/routes/admin-role-console.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.types.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.policy.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console-response.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.service.ts
artifacts/api-server/src/services/platform-admin/admin-role-console/admin-role-console.mock-repository.ts
```

Current page:

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-console-page.tsx
```

Current route wrapper:

```txt
artifacts/pos-system/src/pages/dashboard/admin-role-console.tsx
```

## 5. Read-only boundary

This phase must stay read-only. The console may show future operations as planning rows only.

Allowed in AR-4:

```txt
GET /api/internal/admin-console/roles
```

Blocked in AR-4:

```txt
POST /api/internal/admin-console/*
PATCH /api/internal/admin-console/*
DELETE /api/internal/admin-console/*
database access
Prisma schema promotion
role assignment execution
role revocation execution
permission template write
approval execution
audit write
```

## 6. Promotion requirements for future real data

Before the Admin Role Console can move beyond read-only backend mock data, the project must add:

- browser smoke for OWNER/ADMIN access and MANAGER denial
- final QA checklist for this dashboard
- real permission registry source design
- audit/event policy before any write behavior exists

Write workflows remain out of scope until RBAC, audit, approval policy, rollback, and rate-limit rules exist.

## 7. Validation command

Run:

```bash
pnpm platform-admin:admin-role-check
pnpm platform-admin:check
```

AR-4 is considered valid only if both pass.

## 8. Next safe phase

Next safe phase:

```txt
AR-5 - Browser smoke for platform admin access
```

AR-5 should validate OWNER/ADMIN access, MANAGER denial, source badge rendering, operation notice, fallback UI, and blocked write copy. It should not add database access, Prisma schema promotion, role mutation, audit writes, or approval execution.
