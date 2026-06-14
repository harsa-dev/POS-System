# Team Management Phase 7 Backend Preview Mode

Phase 7 adds a read-only frontend preview mode for Team Management.

The default mode stays `localStorage`.

A second mode, `backend-preview`, can be enabled from the dashboard after clicking `Check Backend Snapshot` and then `Use Backend Preview`.

## Runtime Modes

```txt
localStorage
backend-preview
```

## Behavior

`localStorage` keeps the editable demo dashboard.

`backend-preview` renders data from `GET /api/team-management/snapshot` without changing localStorage.

In backend preview mode:

- overview cards use backend snapshot data
- member table uses backend snapshot data
- role registry uses backend snapshot data
- access log uses backend snapshot data
- edit panels are hidden

## Files

```txt
artifacts/pos-system/src/features/shared/team-management/components/snapshot-sync-panel.tsx
artifacts/pos-system/src/features/shared/team-management/components/index.ts
artifacts/pos-system/src/features/shared/team-management/team-management-page.tsx
```

## Validation

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/pos-system run typecheck
pnpm --filter @workspace/pos-system run build
pnpm --filter @workspace/pos-system run v3:sidebar-parity
```

## Next Phase

Phase 8 should add one small backend write path after this preview mode is verified locally.
