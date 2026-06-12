# Reports Phase 9 Manual E2E

Phase 9 verifies the Financial Reports implementation end-to-end using real application flows and persisted backend data.

This phase does not add new financial-report logic. It validates that the previous phases behave correctly across frontend, backend, database, permissions, source health, reconciliation, and export.

## Goal

Confirm that Financial Reports are generated from real source records and that the dashboard does not rely on hardcoded values, fake rows, frontend-calculated totals, or frontend-trusted permissions.

## Scope

Phase 9 covers:

- Paid order revenue.
- Cashflow sync from order payment.
- Manual expense cashflow.
- Stock movement cost snapshot.
- Open invoice receivables.
- Source health warnings.
- Reconciliation detail rows.
- CSV and JSON export.
- Role-based access checks.

Phase 9 does not cover:

- Automated E2E test implementation.
- Server-rendered PDF export.
- Full accounting ledger.
- Tax filing reports.
- Multi-branch consolidation.

## Required Environment

Run the app locally with frontend and backend connected to the same database.

```txt
Frontend app -> API server -> PostgreSQL database
```

Before testing:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/pos-system run build
```

Do not continue if any of these commands fail.

## Test Accounts

Use at least these roles:

```txt
OWNER
MANAGER
CASHIER
KITCHEN
SERVER
```

Expected financial report access:

```txt
OWNER   -> can view, reconcile, export
MANAGER -> can view, reconcile, export
CASHIER -> must be denied
KITCHEN -> must be denied
SERVER  -> must be denied
```

## Test Data Setup

Use one restaurant/business scope for the whole test. Do not mix data from another restaurant.

### 1. Create a paid order

Create an order with at least two order items.

Expected backend/database state:

```txt
Order.status = PAID or later valid status
Payment.status = PAID
Order.total contains stored transaction total
OrderItem contains stored item quantity and price snapshot
```

Expected financial report impact:

```txt
summary.totalRevenue increases
summary.orderCount increases
summary.averageOrderValue updates
trend revenue updates
bestSellingProducts includes ordered menu item
```

### 2. Sync order payment to cashflow

Confirm the paid order creates or syncs a cashflow entry.

Expected backend/database state:

```txt
CashflowEntry.sourceType = ORDER_PAYMENT
CashflowEntry.sourceId references paid order or payment source
CashflowEntry.amount matches paid payment amount
CashflowEntry.status is not VOIDED
```

Expected financial report impact:

```txt
summary.cashIn increases
summary.netCashflow increases
cashIn table includes the payment row
sourceHealth.ordersWithoutCashflow does not count this order
```

### 3. Create an expense cashflow row

Create a manual expense row, for example ingredients, utilities, rent, or operational expense.

Expected backend/database state:

```txt
CashflowEntry.type = EXPENSE or equivalent cash-out type
CashflowEntry.amount > 0
CashflowEntry.status is not VOIDED
```

Expected financial report impact:

```txt
summary.totalExpenses increases
summary.cashOut increases
summary.netProfit decreases
summary.netCashflow decreases
cashOut table includes the expense row
profitLoss includes expense line impact
```

### 4. Create a stock movement with cost snapshot

Create an outgoing inventory/recipe usage stock movement with a cost snapshot.

Expected backend/database state:

```txt
StockMovement.type = OUT or recipe usage equivalent
StockMovement.unitCostSnapshot is present
StockMovement.quantity > 0
```

Expected financial report impact:

```txt
summary.cogs increases
summary.grossProfit decreases
grossMargin updates
sourceHealth.stockMovementsMissingCostSnapshot does not count this row
```

### 5. Create a stock movement missing cost snapshot

Create or find an outgoing stock movement without `unitCostSnapshot`.

Expected reconciliation impact:

```txt
missingCostSnapshots contains the row
sourceHealth.stockMovementsMissingCostSnapshot increases
sourceHealth.warnings includes missing cost snapshot warning
```

This verifies that incomplete inventory costing is visible instead of silently corrupting COGS.

### 6. Create an unpaid invoice

Create an invoice with `DRAFT` or `SENT` status and a positive `grandTotal`.

Expected backend/database state:

```txt
Invoice.status = DRAFT or SENT
Invoice.grandTotal > 0
Invoice.restaurantId matches current restaurant
```

Expected financial report impact:

```txt
summary.receivables increases
receivables table includes the invoice
reconciliation.openReceivables includes the invoice
sourceHealth.warnings includes open receivables warning
```

### 7. Create an overdue invoice

Create or update an invoice with:

```txt
Invoice.status = DRAFT or SENT
Invoice.dueDate < today
Invoice.grandTotal > 0
```

Expected reconciliation impact:

```txt
issues includes overdue_receivables
issue severity is critical
openReceivables row description marks it as overdue
```

### 8. Void a cashflow entry

Void one cashflow entry inside the report period.

Expected financial report impact:

```txt
VOIDED cashflow entry is excluded from cash in/out totals
sourceHealth.voidedCashflowEntries increases
reconciliation.voidedCashflowEntries includes the row
```

Voided entries must be visible as audit/reconciliation signals, but must not inflate financial totals.

## Dashboard Verification

Open Financial Reports as OWNER or MANAGER.

### Required UI checks

```txt
KPI cards render backend values.
Period selector refetches report.
Basis selector refetches report.
Refresh button refetches report.
Trend chart uses backend trend rows.
Best selling products table uses backend rows.
Profit & Loss table uses backend rows.
Cash In table uses backend rows.
Cash Out table uses backend rows.
Receivables table uses backend rows.
Source health warnings render backend warnings.
Reconciliation issue cards render backend issues.
Reconciliation detail tables render backend detail rows.
Open Invoice Receivables table renders backend openReceivables rows.
```

### Required empty states

When a section has no rows, it must show an empty state instead of fake placeholder rows.

```txt
No cash in rows -> empty cash in table
No cash out rows -> empty cash out table
No receivables -> empty receivables table
No reconciliation issues -> clean/no issue state
No open receivables -> empty open receivables state
```

### Required error states

Break or stop the backend temporarily and verify:

```txt
Dashboard shows a financial report error state.
Dashboard does not show hardcoded fallback numbers.
Dashboard does not show fake rows.
```

Restore backend after this test.

## API Verification

Run these as OWNER or MANAGER.

```txt
GET /api/financial-reports?from=<date>&to=<date>&basis=hybrid
GET /api/financial-reports/reconciliation?from=<date>&to=<date>&basis=hybrid
GET /api/financial-reports/export?from=<date>&to=<date>&basis=hybrid&format=json
GET /api/financial-reports/export?from=<date>&to=<date>&basis=hybrid&format=csv
```

Expected API behavior:

```txt
All successful responses return JSON envelopes except CSV export content payload.
Report response contains summary, profitLoss, trend, bestSellingProducts, cashIn, cashOut, receivables, sourceHealth.
Reconciliation response contains issues, unsyncedOrders, missingCostSnapshots, pendingCashflowEntries, voidedCashflowEntries, openReceivables.
Export response includes filename, contentType, exportedAt, format, auditLogged.
```

## Permission Verification

Run the same API requests as CASHIER, KITCHEN, and SERVER.

Expected result:

```txt
GET /api/financial-reports -> 403
GET /api/financial-reports/reconciliation -> 403
GET /api/financial-reports/export -> 403
```

Frontend navigation hiding is not enough. Backend 403 is required.

## Export Verification

### JSON export

Expected JSON export data:

```txt
report.period
report.basis
report.generatedAt
report.summary
report.profitLoss
report.trend
report.bestSellingProducts
report.cashIn
report.cashOut
report.receivables
report.sourceHealth
```

### CSV export

Expected CSV sections:

```txt
Report Metadata
Summary
Source Health
Profit And Loss
Trend
Best Selling Products
Cash In
Cash Out
Receivables
Warnings
```

The CSV must be generated from backend report data, not frontend table state.

## Audit Verification

After export, verify an audit log exists for the financial report export.

Expected audit behavior:

```txt
AuditLog exists for export action
AuditLog has current restaurantId
AuditLog has current userId
AuditLog records export format
AuditLog records filename/content type metadata
```

If audit logging fails, export should fail rather than silently skipping audit.

## Database Verification

Use database inspection only to verify persisted source records. Do not edit data directly unless the test step explicitly requires setup.

Required checks:

```txt
Orders are scoped by restaurantId.
Payments are scoped by restaurant/order relationship.
Cashflow rows are scoped by restaurantId.
Invoices are scoped by restaurantId.
Stock movements are scoped by restaurantId.
Voided cashflow is excluded from totals.
Open invoices are included in receivables.
Missing cost snapshots are visible in reconciliation.
```

## Anti-Pattern Checklist

Fail Phase 9 if any of these are true:

```txt
Frontend calculates final revenue, COGS, profit, receivables, or reconciliation status.
Frontend trusts role or restaurantId for report access.
Dashboard shows fake rows when backend has no data.
Dashboard falls back to hardcoded financial totals after API error.
Export is generated from mock data.
Export bypasses backend permission checks.
Export skips audit logging silently.
Queries return data from another restaurant.
Voided cashflow inflates financial totals.
Missing cost snapshot is hidden from source health.
Open receivables are hidden from reconciliation.
```

## Pass Criteria

Phase 9 passes only when:

```txt
All builds pass.
OWNER and MANAGER can view, reconcile, and export.
CASHIER, KITCHEN, and SERVER receive backend 403.
Dashboard data matches backend report response.
Backend report response matches persisted database source records.
CSV export includes all required sections.
JSON export includes full report payload.
Export audit log is created.
Source health warnings match reconciliation issues.
No fake frontend data appears.
No schema workaround is added.
```

## Deferred Work

These are intentionally not part of Phase 9:

```txt
Automated Playwright E2E tests.
Automated API integration tests with seeded fixtures.
Server-generated PDF export.
Accounting-grade ledger closing.
Multi-branch consolidation.
External accounting integration.
```

These should become future phases after the manual E2E checklist is stable.
