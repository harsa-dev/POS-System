# Team Management Phase 8 Member Status API

Phase 8 adds the first Team Management backend write endpoint.

## Endpoint

```txt
PATCH /api/team-management/members/:memberId/status
```

## Payload

```ts
{
  status: "Active" | "Suspended";
  reason?: string;
}
```

`Pending` is not persisted yet because the current backend only has `User.isActive`. Pending should wait for a future invite or onboarding model.

## Behavior

The endpoint:

- requires OWNER, MANAGER, or ADMIN
- updates `User.isActive`
- writes an `AuditLog` row
- returns a fresh Team Management snapshot
- returns the created audit log mapped to the Team Management log shape

## Guardrails

- users cannot suspend their own active session account
- non-owner management users cannot update OWNER, MANAGER, or ADMIN accounts
- unsupported member IDs return 404
- unsupported status values return 400

## Files

```txt
artifacts/api-server/src/routes/team-management.ts
artifacts/pos-system/src/features/shared/team-management/team-management-contract.ts
```

## Validation

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/pos-system run typecheck
pnpm --filter @workspace/pos-system run build
pnpm --filter @workspace/pos-system run v3:sidebar-parity
```

## Manual Test

After login as OWNER, MANAGER, or ADMIN:

```http
PATCH /api/team-management/members/<memberId>/status
Content-Type: application/json

{
  "status": "Suspended",
  "reason": "Manual Team Management test"
}
```

Expected response:

```txt
success: true
message: Team member status updated.
data.snapshot.source: api
data.log.action: UPDATE_ROLE
```

## Next Phase

Phase 9 can wire this endpoint into a controlled frontend action, preferably only in backend-preview mode after a fresh snapshot is loaded.
