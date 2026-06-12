# Reports Phase 10 UI Polish

Phase 10 focuses on UI polish and standardization for the shared dashboard layer and the Financial Reports feature dashboard.

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
- `DataTable` now supports default client-side pagination for long loaded table data.
- `financial-reports-dashboard.tsx` has been migrated away from raw palette classes for its local charts, rankings, calendar, source health, reconciliation states, data source cards, loading state, and error state.
- Financial Reports basis selector now uses the shared `financialReportBases` contract instead of an inline hardcoded basis list.
- Financial Reports basis changes are guarded with `isFinancialReportBasis()` before updating state.
- `tone="neutral"` was replaced with `tone="slate"`.

## Financial Reports Dashboard Polish

The feature-level dashboard polish keeps the existing backend-backed data flow intact:

```txt
financialReportsApi.getReport()
financialReportsReconciliationApi.getReconciliation()
financialReportExportApi.exportReport()
```

No data source was replaced with mock data.

Migrated dashboard areas:

```txt
Profit and loss row tone classes
Reconciliation issue severity cards
Trend mini chart bars
Best-selling product ranking bars
Compact selected-range calendar
Source health metric cards
Source health warning panel
Reconciliation empty/loading states
Header text hierarchy
Error alert
Data source selector cards
Loading state
Average order value card tone
```

## Table Pagination

`DataTable` now paginates long loaded table data by default.

Rules:

```txt
Default page size: 10 rows
Pagination appears only when data length exceeds page size
Empty state remains visible when there are no rows
Previous/Next buttons use semantic tokens
Pagination is client-side over the rows already returned by the backend
```

Important limitation:

```txt
This is UI pagination, not backend cursor/offset pagination.
Financial report/reconciliation APIs must still avoid unlimited backend reads.
If the report grows beyond backend limits, add server-side pagination at the API/repository layer.
```

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
bg-accent
text-accent-foreground
bg-chart-2
bg-chart-3
ring-ring
ring-border
```

Avoid spreading raw palette classes in shared primitives and financial report dashboard code:

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

## Backend and Database Rules

- No backend behavior is changed by Phase 10 UI polish.
- No schema or migration is required.
- No frontend cache is added for private financial report data.
- Export and report API behavior remains backend-owned.
- Reconciliation warnings remain backend-owned.
- Rate limiting remains a backend responsibility.
- Client-side table pagination must not be treated as a replacement for backend query limits.

## Caching and Rate Limiting Rules

- Do not add client-side persistence for private financial report data.
- Do not cache financial report payloads in localStorage/sessionStorage.
- Do not make UI refresh loops that spam report/reconciliation/export endpoints.
- Keep export buttons disabled while a report is missing or export is in progress.
- If backend returns 429 later, UI should show a clear error message rather than fake data.

## Anti-Pattern Checklist

- No fake report values.
- No hardcoded financial totals.
- No frontend-generated reconciliation issues.
- No frontend-owned permission checks.
- No tenant scope from frontend input.
- No UI polish that hides backend errors.
- No stale file overwrite that removes previous phase work.
- No raw color utility spread in the polished financial report areas.
- No hardcoded report basis option list when the API contract already exports the allowed bases.
- No assumption that UI pagination protects the database from heavy queries.

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
Long tables show pagination controls.
Pagination Previous/Next buttons work.
Pagination resets when table data changes.
Export buttons remain disabled while no report is loaded.
Export CSV/JSON still uses backend export.
Reconciliation panel still shows source issues from backend.
Open invoice receivables table still exists.
Data source selector still changes report basis.
Period selector still changes backend query period.
Trend and ranking bars still render.
No raw neutral/blue/emerald/amber/rose palette classes are visible in financial-reports-dashboard.tsx.
```

## Deferred

- Central visual spec/design.md.
- Visual regression tests.
- Storybook or screenshot baseline tests.
- Server-side pagination for large report/reconciliation tables.
- Dedicated shadcn/ui migration if the project later standardizes the shared component folder around shadcn primitives.
