# Reports Phase 6 Dashboard Integration

Phase 6 follows the original Financial Reports plan: replace the hardcoded dashboard with a backend-backed dashboard.

## Scope

This phase covers the frontend financial reports dashboard only.

The dashboard must display backend report data from:

- `GET /api/financial-reports`
- `GET /api/financial-reports/export`
- `GET /api/financial-reports/reconciliation`

The frontend must not calculate final financial truth.

## Completed

- Financial report dashboard uses `financialReportsApi.getReport()`.
- KPI cards use backend summary values.
- Profit and loss table uses backend `profitLoss` rows.
- Trend section uses backend `trend` rows.
- Best selling products use backend `bestSellingProducts` rows.
- Cash In and Cash Out tables use backend ledger rows.
- Receivables table uses backend invoice rows.
- Source health uses backend source counts and warnings.
- Period selector changes backend query range.
- Basis selector changes backend report basis.
- Refresh button refetches backend report and reconciliation data.
- Loading state is shown while report data is loading.
- Error state is shown when API loading fails.
- Empty table states are handled through table empty messages.
- No hardcoded financial totals remain in the dashboard.
- No mock best-selling product rows remain in the dashboard.
- No mock cashflow rows remain in the dashboard.

## Frontend Rules Kept

- Frontend remains a presentation and input layer.
- Backend remains the business decision maker.
- Database remains the persisted source of truth.
- Frontend does not directly access the database.
- Frontend does not decide tenant scope, permission, role, report totals, payment status, or final financial truth.
- Frontend export uses backend-loaded data or backend export response.

## Backend / Database Rules Kept

- No database schema change was added for Phase 6.
- No financial report data is stored as frontend state in the database.
- Financial report data still comes from backend service and repository layers.
- Financial source records remain orders, payments, order items, cashflow entries, stock movements, invoices, and audit logs.

## Anti-Pattern Checks

- No fake enterprise rows.
- No frontend final totals.
- No direct DB access from frontend.
- No hardcoded report values.
- No tenant ID from frontend.
- No hidden-button security assumption.
- No `any` added to silence TypeScript.

## Manual Test Checklist

- Open Financial Reports as OWNER.
- Open Financial Reports as MANAGER.
- Confirm CASHIER, KITCHEN, and SERVER cannot access the full report if backend permission is tested.
- Change the period selector and confirm report refetches.
- Change report basis and confirm report refetches.
- Confirm KPI values change based on backend response.
- Confirm chart and table rows come from backend response.
- Confirm empty tables show empty messages, not fake rows.
- Confirm Refresh refetches data.
- Confirm backend errors show an error state.

## Deferred

- Visual polish for chart presentation.
- Server-rendered PDF export.
- Automated frontend integration tests for dashboard loading/error/empty states.
- Automated role-based dashboard access tests.
