# BM-9 - Shared Dashboard Mode-Context Rollout

## Goal

Roll out the shared dashboard mode-context contract without rewriting every shared dashboard at once.

BM-8 introduced the contract and applied it first to Cashflow. BM-9 adds reusable rollout helpers so the next shared dashboards can adopt the same contract with smaller patches.

## Added helpers

```txt
artifacts/pos-system/src/features/shared/dashboard/use-shared-dashboard-mode-context.ts
artifacts/pos-system/src/features/shared/dashboard/shared-dashboard-mode-summary-panel.tsx
```

## Hook contract

`useSharedDashboardModeContext(surfaceId)` returns the current shared dashboard mode context and subscribes to `business-mode:changed`.

It is intended for dashboards that keep local state or local API loading instead of React Query. Those dashboards must reload or reset their local state when `queryScopeKey` changes.

## Summary panel contract

`SharedDashboardModeSummaryPanel` renders:

```txt
active mode
query scope key
api mode header
supported modes
support status
```

This gives shared dashboards a consistent visible mode boundary instead of each dashboard inventing its own badge layout.

## Current rollout

Implemented:

```txt
DashboardShell: shared mode badge for registered shared dashboard titles
Cashflow: mode context state, mode change subscription, mode-scoped export filename
```

Ready for next adoption:

```txt
Financial Reports
Invoice Generator
Customers & Partners
Inventory Management
Team Management
Audit Log
Approvals
```

## Non-goals

BM-9 does not migrate every shared dashboard UI file. That should happen in smaller follow-up patches per surface because many of those files are large and have local API/loading state.

## Validation

```bash
pnpm business-mode:check
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Manual smoke:

```txt
1. Open Cashflow in Restaurant mode.
2. Confirm Mode Scope and Query Scope are visible.
3. Switch to Retail.
4. Open Cashflow again.
5. Confirm Query Scope changes to cashflow:retail.
6. Export CSV and confirm active mode is included in filename.
```
