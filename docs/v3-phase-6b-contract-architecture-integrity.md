# V3 Phase 6B Contract Architecture Integrity

## Summary

Phase 6B focused on fixing concrete shared-dashboard bridge drift instead of adding another contract layer. The shared dashboard route pages no longer decide Retail or Raw Material behavior directly. `DashboardShell` is the single frontend resolver for shared dashboard mode adapters.

## Docs And Source Read

- `docs/Prompt-codex.md`
- `artifacts/pos-system/src/App.tsx`
- `artifacts/pos-system/src/features/shared/dashboard/dashboard-shell.tsx`
- `artifacts/pos-system/src/features/shared/dashboard/shared-dashboard-mode-context.ts`
- shared dashboard page entries under `artifacts/pos-system/src/pages/dashboard`
- Retail, Restaurant, and Raw Material shared dashboard bridge files
- Retail shared dashboard frontend API client
- API client envelope helpers

## API Contract Findings

- Retail shared dashboard client used raw `fetch` and a local success-envelope cast.
- The client now uses the shared `apiClient`, preserving credentials, base URL resolution, canonical business-mode headers, JSON parsing, and shared error behavior.
- Backend Retail shared-dashboard endpoint was not changed in this pass.

## Shared Dashboard Architecture Decision

- Route pages now render the actual dashboard/workspace only.
- `DashboardShell` chooses exactly one active mode adapter from the current mode context.
- The previous nested chain of Raw Material, Restaurant, and Retail bridge components was removed from the runtime flow.
- Custom Business remains handled by the existing planned/hidden service-business preview behavior.

## Business Mode Relationship Matrix

| Mode | Status | Shared Dashboard Behavior |
| --- | --- | --- |
| Restaurant | Active | Uses Restaurant adapter when a mapped shared dashboard surface is open. |
| Retail | Active | Uses Retail adapter and Retail shared-dashboard API when mapped. |
| Raw Material | Active | Uses Raw Material adapter and hides generic dashboards where raw-material context is required. |
| Custom Business | Planned | Uses guarded preview/hidden state only; no full implementation added. |

## Auth And Permission Notes

- This pass did not change role or permission policy.
- Shared dashboard direct routes still pass through the app protected route boundary.
- Full frontend typecheck still exposes wider registry/sidebar permission drift that needs a dedicated cleanup.

## Route Guard And Mode Switching Notes

- No route paths were added or renamed.
- Page-level mode checks were removed from shared dashboard pages so mode switching is resolved in one place.
- Existing storage migration boundary for `currentBusinessMode` remains the only observed old-mode repair map.

## Prisma And Schema Notes

- No Prisma schema changes were made.
- Backend TypeScript passed with the current generated client.
- Existing Retail persistence repositories still contain Prisma delegate casts for planned/generated delegate gaps and should be cleaned in a dedicated persistence pass.

## Hardcode Cleanup

- Removed repeated page-level dashboard ID bridge checks from shared dashboard route files.
- Kept title-to-surface mapping inside `DashboardShell` because it is the existing resolution boundary.

## Duplicate And Bridge Cleanup

- Removed duplicate bridge wrapping from 17 dashboard route pages.
- Removed the extra Retail bridge wrapper from `CashflowWorkspace`.
- Replaced nested shell bridge wrapping with single active-mode adapter selection.

## Checks Run

| Command | Result | Notes |
| --- | --- | --- |
| `tsc -p artifacts/pos-system/tsconfig.restaurant.json --noEmit` | Passed | Local binary. |
| `tsc -p artifacts/pos-system/tsconfig.retail.json --noEmit` | Passed | Local binary. |
| `tsc -p artifacts/pos-system/tsconfig.raw-material.json --noEmit` | Passed | Local binary. |
| `tsc -p artifacts/pos-system/tsconfig.service.json --noEmit` | Passed | Local binary. |
| `tsc -p artifacts/api-server/tsconfig.json --noEmit` | Passed | Local binary. |
| `vite build --config vite.config.ts` | Passed | Sourcemap warnings remain. |
| `node scripts/business-mode-switch-check.mjs` | Passed | 42 static checks. |
| `pnpm --filter @workspace/pos-system run typecheck:restaurant` | Blocked | `EPERM: operation not permitted, lstat 'C:\Users\LENOVO'`. |
| `pnpm --filter @workspace/pos-system run build` | Blocked | Same pnpm/Node environment blocker. |
| `pnpm typecheck` | Blocked | Same pnpm/Node environment blocker. |
| `pnpm restaurant:check` | Blocked | Same pnpm/Node environment blocker. |
| `pnpm retail:check` | Blocked | Same pnpm/Node environment blocker. |
| `pnpm raw-material:check` | Blocked | Same pnpm/Node environment blocker. |
| `tsc -p artifacts/pos-system/tsconfig.json --noEmit` | Failed | Existing broad registry/UI contract errors remain outside scoped configs. |

## Remaining Risks

- Full frontend TypeScript still fails due registry/sidebar metadata types, stale role unions, shared card prop drift, and several broad dashboard panel prop mismatches.
- Retail backend persistence still uses `as unknown as` delegate casts around Prisma transaction clients.
- Prisma migrate/generate was not run because schema was not changed in this pass.
- Browser QA was not run in this pass.

## Manual QA Checklist

- Open `/select-mode`.
- Select Restaurant, Retail, and Raw Material.
- Open shared dashboards: overview, analytics, customers, inventory, cashflow, financial reports, invoice, shift reports, team management, and HPP.
- Confirm only one mode-context adapter panel renders per shared dashboard.
- Confirm Custom Business remains planned/guarded.
- Confirm no shared dashboard page bypasses the mode badge/support state in `DashboardShell`.

## Next Recommended Task

Fix the broad frontend registry/sidebar contract drift so full `tsconfig.json` typecheck can pass without weakening shared component types.
