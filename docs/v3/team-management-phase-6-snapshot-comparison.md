# Team Management Phase 6 Snapshot Comparison

## Scope

Phase 6 adds a manual frontend comparison panel between the localStorage Team Management state and the read-only backend snapshot API.

This still does not switch the Team Management dashboard runtime to backend data.

The dashboard remains localStorage-first. The backend snapshot is fetched only when the user clicks the manual check button. Revolutionary patience, apparently.

## Files Added

```txt
artifacts/pos-system/src/features/shared/team-management/team-management-snapshot-compare.ts
artifacts/pos-system/src/features/shared/team-management/components/snapshot-sync-panel.tsx
```

## Files Updated

```txt
artifacts/pos-system/src/features/shared/team-management/components/index.ts
artifacts/pos-system/src/features/shared/team-management/team-management-page.tsx
```

## Runtime Behavior

The Team Management page now renders a `Backend Snapshot Check` panel near the top of the dashboard.

The panel:

- builds a local snapshot from the current localStorage store
- fetches `GET /api/team-management/snapshot` only when clicked
- compares local vs backend counts
- displays backend metadata
- displays drift warnings
- does not overwrite local state
- does not write to the backend
- does not switch the UI data source

## Comparison Metrics

The comparison currently checks:

- role count
- member count
- active member count
- pending member count
- suspended member count
- access log count
- backend contract version

## Why This Exists

This panel makes the migration path safer:

1. localStorage UI remains stable
2. backend snapshot can be smoke-tested from the dashboard
3. count drift becomes visible before runtime switching
4. later API switching can be done with less guesswork

Without this step, the next developer would wire backend data directly into a complex dashboard and then pretend the resulting bug fog was inevitable. It was not.

## What Is Still Not Implemented

- automatic backend fetch on page load
- replacing localStorage state with API data
- server-side role create/update/delete
- server-side role assignment
- server-side member status update
- Team Management mutation audit writes
- custom role persistence in database

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

1. Start the API server.
2. Start the POS frontend.
3. Login as OWNER, MANAGER, or ADMIN.
4. Open `/dashboard/team-management`.
5. Click `Check Backend Snapshot`.
6. Confirm either:
   - counts aligned, or
   - expected drift warnings appear.

## Next Phase Candidate

Phase 7 should add an adapter mode flag, still disabled by default:

```txt
localStorage | backend-preview
```

The first version should only allow read-only rendering from backend snapshot. Do not add mutations yet. The project has suffered enough ambition for one week.
