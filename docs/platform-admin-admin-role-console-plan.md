# Platform Admin - Admin Role Console Plan

## 1. Scope

Dashboard scope:

```txt
/dashboard/internal/admin-role-console
```

This dashboard is the next Platform Admin console after Internal Monitoring. It is intentionally scoped as a read-only, mock-backed access governance console for portfolio visibility and future implementation planning.

It does not implement real role assignment, role revocation, permission template persistence, audit writes, approval workflows, or Prisma schema changes in this phase.

## 2. Current phase

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
- no POST/PATCH/DELETE internal role endpoint
- no role assignment mutation
- no role revocation mutation
- no permission template mutation
- no audit write
- no approval execution

## 3. What the dashboard shows

The current console displays mock-backed planning views for:

- Admin role overview
- Internal admin metrics
- Access review workflow planning
- Future API contracts
- Backend readiness checklist
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

## 4. Read-only boundary

This phase must stay read-only. The console may show future role operations as mock rows only.

Blocked in AR-1:

```txt
POST /api/internal/admin-console/role-requests
PATCH /api/internal/admin-console/role-requests/:id
DELETE /api/internal/admin-console/role-requests/:id
```

The only planned future read endpoint in the current mock contract is:

```txt
GET /api/internal/admin-console/roles
```

That endpoint is still not implemented in AR-1.

## 5. Promotion requirements for future real API

Before the Admin Role Console can move beyond mock-backed read-only mode, the project must add:

- backend policy for `platform-admin.admin-role-console.read`
- backend GET endpoint for role overview
- response envelope contract
- contract parity snapshot
- audit model or reuse of existing audit system
- approval policy for any write workflow
- rate limit and rollback note for every write path
- browser smoke for OWNER/ADMIN access and MANAGER denial

## 6. Validation command

Run:

```bash
pnpm platform-admin:admin-role-check
pnpm platform-admin:check
```

AR-1 is considered valid only if both pass.

## 7. Next safe phase

Next safe phase:

```txt
AR-2 - Admin Role Console read-only backend contract plan
```

AR-2 should add backend DTO/policy planning and a GET-only contract design. It should not add role mutation, audit writes, approval execution, or Prisma schema promotion yet.
