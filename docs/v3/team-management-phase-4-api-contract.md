# Team Management Phase 4 API Contract Boundary

## Scope

Phase 4 prepares the Team Management workspace for backend wiring without enabling real API calls from the UI yet.

This phase intentionally does not create Prisma migrations, backend routes, invite email flows, payroll, attendance integration, or server-side audit writes.

The purpose is to make the future API shape explicit before wiring it into runtime. Apparently naming things before building them is considered civilization.

## Files Added

```txt
artifacts/pos-system/src/features/shared/team-management/team-management-contract.ts
artifacts/pos-system/src/features/shared/team-management/team-management-api.ts
```

## Contract Version

```ts
TEAM_MANAGEMENT_API_CONTRACT_VERSION = "team-management.v1.local-contract"
```

The version name is deliberately explicit: the current runtime is still localStorage-first, but the DTO and mutation shapes are now ready for a backend adapter.

## Planned Endpoints

```txt
GET    /api/team-management/snapshot
GET    /api/team-management/roles
POST   /api/team-management/roles
PATCH  /api/team-management/roles/:roleId
DELETE /api/team-management/roles/:roleId
GET    /api/team-management/members
PATCH  /api/team-management/members/:memberId/role
PATCH  /api/team-management/members/:memberId/status
GET    /api/team-management/audit-log
```

## Snapshot DTO

The main API read contract is:

```ts
type TeamManagementSnapshotDto = {
  contractVersion: typeof TEAM_MANAGEMENT_API_CONTRACT_VERSION;
  source: "localStorage" | "api";
  generatedAt: string;
  roles: ManagedRole[];
  members: TeamMember[];
  logs: AccessChangeLog[];
};
```

## Mutation Result DTO

Role/member mutations should return the full normalized snapshot plus a log entry:

```ts
type TeamManagementMutationResultDto = {
  snapshot: TeamManagementSnapshotDto;
  log: AccessChangeLog;
  message: string;
};
```

Returning the full snapshot keeps the frontend simple and avoids partial cache drift. Yes, humans invented cache invalidation and then acted surprised when it became a problem.

## Payloads Prepared

- `CreateTeamRolePayload`
- `UpdateTeamRolePayload`
- `DeleteTeamRolePayload`
- `AssignTeamMemberRolePayload`
- `UpdateTeamMemberStatusPayload`
- `TeamManagementListQuery`
- `TeamManagementAuditQuery`

## Frontend Runtime Rule

The UI must continue using localStorage until the backend routes exist and pass local validation.

Do not switch `team-management-page.tsx` to `teamManagementApi` yet.

## Backend Mapping Candidate

The first backend implementation should map to existing schema before inventing new tables:

- existing `User`
- existing `Permission`
- existing `RolePermission`
- existing `AuditLog`

Possible later entities, only after the first adapter is stable:

- `EmployeeProfile`
- `Department`
- `EmployeeRoleAssignment`

## Local Validation

Run from repo root:

```bash
pnpm --filter @workspace/pos-system run typecheck
pnpm --filter @workspace/pos-system run build
pnpm --filter @workspace/pos-system run v3:sidebar-parity
```

## Next Phase Candidate

Phase 5 should be backend route planning or implementation for read-only snapshot first:

```txt
GET /api/team-management/snapshot
```

Do not implement all mutations first. Read path first, then one mutation at a time. The universe has enough entropy already.
