# BM-10 - Financial Reports Mode-Context Rollout Plan

## Status

Planned after BM-9.

## Goal

Roll out the shared dashboard mode-context contract to Financial Reports without rewriting the whole dashboard.

Financial Reports is the next target after Cashflow because it is finance-adjacent and can confuse users if report totals are shown under the wrong active business mode.

## Scope

Implement only small, low-risk changes:

1. Import `useSharedDashboardModeContext("financial-reports")`.
2. Display `SharedDashboardModeSummaryPanel` near the top of the dashboard.
3. Add `modeContext.queryScopeKey` to data-loading dependencies if the dashboard uses local state/manual API calls.
4. Add active mode to export filenames or report titles.
5. Keep existing layout, tables, cards, and calculations intact.

## Guardrails

- Do not rewrite Financial Reports layout in this phase.
- Do not change report formulas unless there is a documented bug.
- Do not add destructive actions.
- Do not mix Restaurant/Retail/Raw Material data under one visual state.
- Keep BM static check updated if a new shared-dashboard mode contract becomes required.

## Validation

```bash
pnpm business-mode:check
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

## Manual smoke

```txt
1. Open Financial Reports in Restaurant mode.
2. Confirm mode context panel says Restaurant.
3. Switch Retail.
4. Open Financial Reports again.
5. Confirm mode context panel says Retail.
6. Export/download report and confirm filename/title includes active mode if supported.
```

## Next after BM-10

Continue mode-context rollout to:

```txt
BM-11 - Invoice Generator mode-context rollout
BM-12 - Customers & Partners mode-context rollout
BM-13 - Inventory Management mode-context rollout
```
