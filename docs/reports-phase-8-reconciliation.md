# Reports Phase 8 Source Health and Reconciliation

Phase 8 expands Financial Reports beyond basic KPI display by checking whether the report sources are internally consistent.

The dashboard must not invent reconciliation state. Backend reconciliation queries own the checks and every query must remain scoped by the authenticated restaurant context.

## Implemented Checks

- Paid or operational orders without a posted cashflow ledger entry.
- COGS stock movements missing `unitCostSnapshot`.
- Pending cashflow entries excluded from posted totals.
- Voided cashflow entries present inside the selected period.
- Open invoice receivables from `DRAFT` or `SENT` invoices.
- Overdue open invoice receivables when `dueDate` is already past.

## Backend Rules

- Reconciliation uses `shared.financialReports.view`.
- Reconciliation runs in the financial reports service layer.
- All raw SQL queries are scoped by `restaurantId`.
- Detail queries are limited to 50 rows to avoid unbounded report payloads.
- No frontend-provided restaurant ID, role, or permission value is trusted.
- No database schema change is required for Phase 8.

## Frontend Rules

- The dashboard reads reconciliation issues from the backend API.
- The dashboard shows issue cards from backend severity and count.
- The dashboard shows detail tables for every reconciliation category.
- The dashboard uses empty states when a detail category has no rows.
- The dashboard does not calculate financial reconciliation itself.

## Data Source Rules

- Orders are compared against cashflow entries with `sourceType = ORDER_PAYMENT`.
- Stock movements are checked for recipe/order usage without cost snapshot.
- Cashflow checks include `PENDING` and `VOIDED` entries.
- Invoice checks use `DRAFT` and `SENT` invoices as open receivables.
- Overdue receivables require a non-null `dueDate` earlier than reconciliation time.

## Manual Test Checklist

```txt
OWNER/MANAGER:
- GET /api/financial-reports/reconciliation returns issues and detail rows.
- Paid order without cashflow entry appears in unsyncedOrders.
- OUT stock movement without unitCostSnapshot appears in missingCostSnapshots.
- Pending cashflow entry appears in pendingCashflowEntries.
- Voided cashflow entry appears in voidedCashflowEntries.
- Draft or sent invoice appears in openReceivables.
- Overdue draft or sent invoice creates an overdue issue.

CASHIER/KITCHEN/SERVER:
- GET /api/financial-reports/reconciliation returns 403.
```

## Deferred

- Automated integration tests for every reconciliation category.
- Drill-down links from reconciliation rows to source modules.
- Dedicated backend reconciliation export endpoint.
