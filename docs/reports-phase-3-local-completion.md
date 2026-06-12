# Reports Phase 3 Local Completion

## Scope

This phase completes the remaining financial report hardening that could not be fully committed through the connector.

## Completed

- Added backend reconciliation endpoint.
- Added frontend reconciliation API client.
- Added backend-driven CSV and JSON export actions.
- Wired financial report dashboard export actions to backend export endpoint.
- Added reconciliation issue cards to the dashboard.
- Kept frontend as presentation/input layer only.
- Kept backend as the financial decision maker.
- Kept database-backed official records as the source of truth.

## Backend Pipeline

Financial report data is derived from:

- Order and OrderItem for revenue, order count, and best sellers.
- StockMovement and InventoryItem for COGS.
- CashflowEntry for cash in, cash out, expenses, pending entries, voided entries, and ledger health.
- Invoice for receivables.

## Reconciliation Checks

The reconciliation endpoint reports:

- Paid orders without cashflow ledger entries.
- COGS movements missing unit cost snapshots.
- Pending cashflow entries excluded from posted totals.
- Voided cashflow entries excluded from posted totals.

## Frontend Rules

- No hardcoded financial values.
- No frontend-owned final money calculation.
- No fake source controls.
- No fake export.
- No direct database access.
- No hidden button security.
- No optimistic update for financial report data.

## Backend Rules

- Routes remain thin.
- Service/reconciliation layer owns report logic.
- Repository/raw SQL reads remain scoped by restaurantId.
- Export and reconciliation require backend permission checks.
- Response shape remains consistent with the shared success envelope.

## Test Checklist

- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm --filter @workspace/api-server run build`
- `pnpm --filter @workspace/pos-system run build`
- Open Financial Reports dashboard.
- Change period.
- Change basis.
- Export CSV.
- Export JSON.
- Refresh reconciliation.
- Verify reconciliation cards match backend source-health issues.

## Deferred

- Dedicated server-rendered PDF.
- Drill-down drawer per reconciliation detail row.
- Automated frontend integration tests.
- Dedicated audit log entry for report export.