# Reports Phase 10 UI Polish

Phase 10 focuses on UI polish and standardization for the shared dashboard layer used by Financial Reports.

The goal is visual consistency without changing financial logic. Financial numbers, source health, reconciliation, permissions, exports, and tenant scope must continue to come from backend/database sources.

## References

- Frontend documentation is the primary UI guideline.
- Database and storage documentation remains the source-of-truth guardrail.
- Caching documentation is used to avoid stale private financial data.
- Rate limiting documentation is used to keep expensive report/export actions defensive.
- Anti-pattern documentation is used to prevent fake enterprise UI and frontend-owned business logic.

## Completed

- `DashboardTone` now supports `red` so existing financial cards can use a destructive tone without type errors.
- `StatCard` uses semantic design tokens instead of raw neutral backgrounds.
- `DashboardActionButton` uses semantic button tokens and focus-visible states.
- `DashboardHeader` and `DashboardPanel` use semantic border/card/foreground tokens.
- `DashboardTabs` uses semantic muted/card/foreground tokens.
- `SelectFilter` uses semantic card/border/focus tokens.
- `DataTable` uses semantic muted/border/foreground tokens and row hover state.

## Design Token Direction

Use these Tailwind token classes for shared dashboard UI:

```txt
bg-background
text-foreground
bg-card
text-card-foreground
border-border
bg-muted
text-muted-foreground
bg-primary
text-primary
text-primary-foreground
text-destructive
bg-destructive/10
ring-ring
```

Avoid spreading raw palette classes in shared primitives:

```txt
bg-white
text-white
text-neutral-*
bg-neutral-*
border-neutral-*
bg-blue-*
bg-emerald-*
bg-amber-*
bg-rose-*
```

Raw palette classes may still exist in feature-level dashboards until those screens are migrated. Do not overwrite stale feature files because that can remove backend/data changes from earlier phases.

## Financial Reports Dashboard Remaining Work

`financial-reports-dashboard.tsx` still needs a feature-level polish pass.

Target cleanup:

- Replace raw palette classes with semantic tokens or local variant maps.
- Replace `tone="neutral"` with `tone="slate"` if still present.
- Standardize issue severity styling.
- Standardize source health warning styling.
- Standardize chart bar colors using theme/chart tokens.
- Standardize data source card selected and hover states.
- Keep all report data backend-backed.
- Keep loading, error, and empty states visible.
- Do not remove Phase 8 reconciliation tables such as `openReceivables`.

## Backend and Database Rules

- No backend behavior is changed by Phase 10 UI polish.
- No schema or migration is required.
- No frontend cache is added for private financial report data.
- Export and report API behavior remains backend-owned.
- Rate limiting remains a backend responsibility.

## Anti-Pattern Checklist

- No fake report values.
- No hardcoded financial totals.
- No frontend-generated reconciliation issues.
- No frontend-owned permission checks.
- No tenant scope from frontend input.
- No UI polish that hides backend errors.
- No stale file overwrite that removes previous phase work.

## Manual Verification

Run after UI polish:

```bash
pnpm --filter @workspace/pos-system run build
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
```

Manual screen checks:

```txt
OWNER can open Financial Reports.
MANAGER can open Financial Reports.
CASHIER/KITCHEN/SERVER still cannot view reports.
Loading state is visible.
Error state is visible.
Empty tables are visible.
Export buttons remain disabled while no report is loaded.
Export CSV/JSON still uses backend export.
Reconciliation panel still shows source issues from backend.
```

## Deferred

- Full feature-level `financial-reports-dashboard.tsx` semantic-token migration.
- Central visual spec/design.md.
- Visual regression tests.
- Storybook or screenshot baseline tests.
