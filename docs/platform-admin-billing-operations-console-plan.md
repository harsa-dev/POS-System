# Platform Admin - Billing Operations Console Plan

## 1. Scope

Dashboard scope:

```txt
/dashboard/internal/billing-operations-console
```

This is the next Platform Admin console after Admin Role Console. It starts as a read-only billing visibility console for subscription health, invoice queues, payment risk, and billing operations planning.

This phase does not add billing provider mutations, database access, Prisma schema changes, billing write handlers, tenant status changes, account credit changes, approval execution, or audit writes.

## 2. Rollout style

Billing Operations Console follows the same staged style as Internal Monitoring and Admin Role Console:

```txt
BO-1 - Read-only access guard and scope isolation
BO-2 - Frontend data source adapter and section fallback
BO-3 - Backend read-only scaffold and API fallback integration
BO-4 - UX hardening and read-only safety copy
BO-5 - Browser smoke for platform admin access
BO-6 - Final QA checklist
```

## 3. Current phase

### BO-1 - Read-only access guard and scope isolation

Status: Done

Implemented guardrails:

- dedicated frontend capability: `platform-admin.billing-operations-console.read`
- allowed frontend roles: `OWNER`, `ADMIN`
- sidebar entry requires `platform-admin.billing-operations-console.read`
- route page wraps the console in `PlatformAdminRoute`
- dashboard remains mock-backed
- no backend endpoint implementation in BO-1
- no database access
- no Prisma schema changes
- no billing write behavior
- no approval execution
- no audit write

## 4. Current files

Current route wrapper:

```txt
artifacts/pos-system/src/pages/dashboard/billing-operations-console.tsx
```

Current shared mock page:

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-console-page.tsx
```

Current shared mock source:

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-consoles.mock.ts
```

Current frontend policy files:

```txt
artifacts/pos-system/src/components/core/platform-admin/platform-admin-policy.ts
artifacts/pos-system/src/app/registry/module-types.ts
artifacts/pos-system/src/app/registry/permission-compat.ts
artifacts/pos-system/src/app/registry/core-modules.ts
```

## 5. Read-only boundary

Allowed in BO-1:

```txt
render mock-backed dashboard
read frontend route auth state
show planning-only billing rows
```

Blocked in BO-1:

```txt
backend billing operations endpoints
database access
Prisma schema promotion
billing provider mutation
account status mutation
approval execution
audit write
```

## 6. Promotion requirements

Before this console can move past BO-1, it needs:

- frontend data source adapter
- source/fallback state
- section fallback behavior
- read-only safety copy
- browser smoke
- final QA checklist

Backend read-only work can be introduced later using the same API-first plus fallback style as Admin Role Console.

## 7. Validation command

Run:

```bash
pnpm platform-admin:billing-operations-check
pnpm platform-admin:check
```

## 8. Next safe phase

Next safe phase:

```txt
BO-2 - Billing Operations Console frontend data source adapter and section fallback
```

BO-2 should add a frontend data source adapter and section fallback state only. It should not add backend routes, database access, Prisma schema promotion, billing writes, approval execution, or audit writes.
