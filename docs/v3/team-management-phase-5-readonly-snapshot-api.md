# Team Management Phase 5 Read-only Snapshot API

## Scope

Phase 5 adds the first backend endpoint for Team Management:

```txt
GET /api/team-management/snapshot
```

This endpoint is read-only. It does not create, update, delete, invite, assign, approve, migrate, seed, or write audit data.

That restraint is intentional. Mutation-first backend development is how perfectly normal projects become unpaid archaeology.

## Files Changed

```txt
artifacts/api-server/src/routes/team-management.ts
artifacts/api-server/src/routes/index.ts
artifacts/pos-system/src/features/shared/team-management/team-management-contract.ts
```

## Runtime Route

The Express app mounts `routes/index.ts` under `/api`, so the route file registers:

```txt
/team-management/snapshot
```

The public endpoint is therefore:

```txt
/api/team-management/snapshot
```

## Access Rule

The endpoint requires `MANAGEMENT_ROLES`:

```txt
OWNER
MANAGER
ADMIN
```

This matches the current Team Management sensitivity level. Viewer/operator/staff accounts should not inspect team-wide account metadata from this backend endpoint yet.

## Data Sources

The snapshot maps existing database data only:

- `User` for team members
- `Role` enum for default managed roles
- `AuditLog` for recent access-style log rows
- current business context for business metadata

No Prisma schema changes are required.

## Response Shape

The response follows the existing frontend contract version:

```ts
TEAM_MANAGEMENT_API_CONTRACT_VERSION = "team-management.v1.local-contract"
```

The response body data includes:

```ts
{
  contractVersion: "team-management.v1.local-contract",
  source: "api",
  generatedAt: string,
  business: {
    id: string,
    name: string,
    mode: "restaurant" | "retail" | "raw-material" | "custom-business",
    type: string,
  },
  viewer: {
    userId: string,
    role: "OWNER" | "MANAGER" | "ADMIN" | "OPERATOR" | "STAFF" | "VIEWER",
  },
  roles: ManagedRole[],
  members: TeamMember[],
  logs: AccessChangeLog[],
}
```

## Mapping Notes

### Roles

The endpoint returns canonical locked role templates for:

```txt
OWNER
MANAGER
ADMIN
OPERATOR
STAFF
VIEWER
```

The role `assignedUsers` count is computed from users in the current business.

### Members

The endpoint maps users into the existing frontend member shape:

```ts
type TeamMember = {
  id: string;
  name: string;
  email: string;
  area: string;
  roleId: string;
  status: "Active" | "Pending" | "Suspended";
};
```

Currently:

- active users map to `Active`
- inactive users map to `Suspended`
- role area is derived from role enum

### Logs

Recent `AuditLog` rows are mapped into the existing `AccessChangeLog` shape.

Because the existing `AuditAction` enum only has `CREATE`, `UPDATE`, and `DELETE`, the route maps those into compatible frontend actions:

```txt
CREATE -> CREATE_ROLE
UPDATE -> UPDATE_ROLE
DELETE -> DELETE_ROLE
```

This is temporary compatibility mapping, not the final audit design.

## What Is Still Not Implemented

- UI runtime switch from localStorage to API
- role create/update/delete backend mutation
- member role assignment backend mutation
- member status mutation
- custom role persistence beyond enum roles
- invite email flow
- server-side audit write for Team Management mutations
- Prisma schema changes for EmployeeProfile or EmployeeRoleAssignment

## Local Validation

Run from repo root:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/pos-system run typecheck
pnpm --filter @workspace/pos-system run build
pnpm --filter @workspace/pos-system run v3:sidebar-parity
```

## Manual Smoke Test

After logging in as OWNER/MANAGER/ADMIN and running the API server:

```txt
GET /api/team-management/snapshot
```

Expected result:

```txt
success: true
source: api
roles: 6 default locked roles
members: current business users
logs: recent audit log rows or empty array
```

## Next Phase Candidate

Phase 6 should add an optional frontend adapter that can compare localStorage snapshot vs backend snapshot without replacing the UI runtime yet.

Do not wire mutations next. Snapshot comparison first. Barbarism delayed is maintainability gained.
