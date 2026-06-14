# Team Management Phase 3 Stabilization

## Scope

Phase 3 stabilizes the frontend-only Team Management workspace after the Phase 1 refactor and Phase 2 local UX upgrade.

This phase still does not introduce backend APIs, Prisma migrations, real employee writes, invite email flows, attendance integration, payroll, or server-side audit writes.

Software will survive this restraint, tragically.

## What Changed

- Hardened `role-permission-store.ts` with a normalization layer for localStorage and imported JSON.
- Preserved default locked roles even when imported JSON is incomplete.
- Sanitized imported role permissions against the current permission module registry.
- Sanitized member status, role references, and access log actions.
- Reassigned broken member role references to the fallback Viewer role.
- Exported sanitized state instead of dumping potentially stale localStorage shape.
- Updated Team Management page import flow to sanitize JSON before applying it to UI state.
- Added selected role/member/assignment fallback effects so stale IDs do not leave the UI pointing at deleted data.

## Current Runtime Contract

The local store contract remains:

```ts
export type RolePermissionStoreState = {
  version: 3;
  roles: ManagedRole[];
  members: TeamMember[];
  logs: AccessChangeLog[];
};
```

The runtime source is still localStorage:

```txt
pos-v3-demo-role-permissions-real-job-library
```

## Validation To Run Locally

Run these from the repository root:

```bash
pnpm --filter @workspace/pos-system run typecheck
pnpm --filter @workspace/pos-system run build
pnpm --filter @workspace/pos-system run v3:sidebar-parity
```

## Known Non-Code Deploy Noise

The latest external status checks may fail because of Vercel build-rate-limit or unrelated service deployment checks. Treat those separately from local typecheck/build validation.

## Next Backend Phase Candidate

Only after the frontend compiles cleanly, the next backend candidate is a Team Management API adapter that maps the current local contract toward existing backend entities:

- existing `User`
- existing `Permission`
- existing `RolePermission`
- existing `AuditLog`

Do not create new employee/payroll/attendance schema until Team Management role assignment is stable.
