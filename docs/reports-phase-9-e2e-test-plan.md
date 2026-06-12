# Reports Phase 9 E2E Test Plan

Phase 9 validates the Financial Reports flow end-to-end across frontend, backend, database, permissions, source health, reconciliation, and export.

This document is a manual E2E checklist first. It can later be converted into Playwright/API integration tests.

## Goals

* Verify that Financial Reports use real backend data.
* Verify that financial numbers come from stored business records, not frontend calculations.
* Verify that permissions protect financial report access.
* Verify that order, payment, cashflow, stock movement, invoice, and reconciliation flows connect correctly.
* Verify that export uses the same backend report data.
* Verify that dashboard loading, error, empty, and success states are usable.
* Verify that no fake enterprise data is displayed.

## Non-Goals

* No full accounting ledger automation.
* No tax compliance validation.
* No external payment gateway certification.
* No server-rendered PDF generation.
* No microservice or queue testing.
* No automated Playwright implementation yet.

## Required Roles

Use these roles during manual testing:

```txt
OWNER
MANAGER
CASHIER
KITCHEN
SERVER
```

Expected access:

```txt
OWNER   -> Can view/export financial reports and reconciliation.
MANAGER -> Can view/export financial reports and reconciliation.
CASHIER -> Must be denied financial reports.
KITCHEN -> Must be denied financial reports.
SERVER  -> Must be denied financial reports.
```

## Required Environment

Before testing, make sure both apps run against the same backend/database:

```txt
Frontend App  -> POS System frontend
Backend API   -> API server
Database      -> PostgreSQL/Prisma database
```

Required environment checks:

```txt
DATABASE_URL is set.
Backend API server is running.
Frontend is pointed to the correct API base URL.
Authentication works.
Current test user has a restaurant/business context.
Financial report routes are mounted.
Prisma client is generated.
```

## Required Commands Before E2E

Run these before manual testing:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/pos-system run build
```

Optional but recommended:

```bash
pnpm --filter @workspace/api-server exec prisma validate
```

## Data Setup Checklist

Prepare one test restaurant with the following users:

```txt
OWNER user
MANAGER user
CASHIER user
KITCHEN user
SERVER user
```

Prepare these business records:

```txt
At least 2 menu items
At least 2 inventory items
At least 1 recipe link from menu item to inventory item
At least 1 dining table
At least 1 active/open cashier shift
At least 1 enabled payment method
At least 1 invoice-capable customer or test customer name
```

Recommended test date range:

```txt
from = first day of current month
to   = today
basis = hybrid
```

## Global Pass Criteria

Phase 9 passes only when:

```txt
All required builds pass.
OWNER can view financial report.
MANAGER can view financial report.
CASHIER cannot view financial report.
KITCHEN cannot view financial report.
SERVER cannot view financial report.
Paid order appears in revenue.
Paid order creates or maps to cash-in.
Expense appears in cash-out.
Stock usage affects COGS.
Invoice DRAFT/SENT appears as receivable.
Paid invoice no longer appears as open receivable.
Reconciliation detects unsynced paid order.
Reconciliation detects missing cost snapshot.
Reconciliation detects pending cashflow.
Reconciliation detects voided cashflow.
CSV export contains complete report sections.
JSON export contains complete report payload.
No fake financial rows appear.
No frontend-only permission bypass exists.
No tenant data leak occurs.
```

---

# Suite 1: Static Build and Type Safety

## Test 1.1: Backend Typecheck

Command:

```bash
pnpm --filter @workspace/api-server run typecheck
```

Expected:

```txt
Command exits successfully.
No TypeScript error.
No implicit any introduced.
No missing financial report type.
No missing reconciliation field.
```

## Test 1.2: Backend Build

Command:

```bash
pnpm --filter @workspace/api-server run build
```

Expected:

```txt
Command exits successfully.
Financial report routes compile.
Financial report services compile.
Reconciliation service compiles.
Export service compiles.
```

## Test 1.3: Frontend Build

Command:

```bash
pnpm --filter @workspace/pos-system run build
```

Expected:

```txt
Command exits successfully.
FinancialReportsDashboard compiles.
financial-reports-api.ts compiles.
financial-reports-export-api.ts compiles.
financial-reports-reconciliation-api.ts compiles.
No missing property errors.
No invalid import errors.
```

---

# Suite 2: Permission and RBAC

## Test 2.1: OWNER Can View Financial Reports

Login as:

```txt
OWNER
```

Open:

```txt
Financial Reports dashboard
```

Expected:

```txt
Page loads.
Financial report API returns 200.
KPI cards render from backend response.
No forbidden error.
```

## Test 2.2: MANAGER Can View Financial Reports

Login as:

```txt
MANAGER
```

Open:

```txt
Financial Reports dashboard
```

Expected:

```txt
Page loads.
Financial report API returns 200.
KPI cards render from backend response.
No forbidden error.
```

## Test 2.3: CASHIER Cannot View Financial Reports

Login as:

```txt
CASHIER
```

Attempt:

```txt
Open Financial Reports dashboard or call GET /api/financial-reports
```

Expected:

```txt
Backend returns 403.
Frontend must not show report data.
No KPI, P&L, cashflow, receivables, source health, or export result is visible.
```

## Test 2.4: KITCHEN Cannot View Financial Reports

Login as:

```txt
KITCHEN
```

Expected:

```txt
Backend returns 403.
Frontend must not show report data.
```

## Test 2.5: SERVER Cannot View Financial Reports

Login as:

```txt
SERVER
```

Expected:

```txt
Backend returns 403.
Frontend must not show report data.
```

## Test 2.6: Unauthorized User Cannot Access Reports

Logout or use expired session.

Call:

```txt
GET /api/financial-reports
GET /api/financial-reports/export
GET /api/financial-reports/reconciliation
```

Expected:

```txt
Backend returns 401.
No data leaked.
```

---

# Suite 3: Report Loading, Error, and Empty States

## Test 3.1: Loading State

Open Financial Reports with a slow network or throttled backend.

Expected:

```txt
Loading indicator appears.
Old stale data should not look like fresh loaded data.
Buttons that depend on loaded data should not behave as if report is ready.
```

## Test 3.2: API Error State

Stop backend API, then open Financial Reports.

Expected:

```txt
Frontend shows financial report error state.
No fake KPI cards.
No fake chart.
No fake table rows.
Refresh button remains available if implemented.
```

## Test 3.3: Empty Report State

Use a date range with no order, cashflow, invoice, or stock data.

Expected:

```txt
Summary values are zero or backend-provided empty values.
Tables show empty state.
No hardcoded placeholder rows.
No demo products.
No fake cashflow rows.
No fake receivables.
```

---

# Suite 4: Period and Basis Query

## Test 4.1: Period Selector Updates Backend Query

Action:

```txt
Open Financial Reports.
Select a different period/date range.
```

Expected:

```txt
Frontend calls backend with updated from/to.
KPI values update from backend response.
Tables update from backend response.
No frontend-only filtering of old data.
```

## Test 4.2: Basis Selector Updates Backend Query

Test basis values:

```txt
hybrid
cashflow
orders
```

Expected:

```txt
Frontend calls backend with selected basis.
Backend returns report with matching basis.
UI displays selected basis result.
No invalid basis string is sent.
```

## Test 4.3: Refresh Refetches Current Query

Action:

```txt
Select period.
Select basis.
Click Refresh.
```

Expected:

```txt
Frontend refetches current query.
Report data is refreshed.
No duplicate local rows.
No stale export query.
```

---

# Suite 5: Paid Order to Revenue and Cash In

## Test 5.1: Create Order

Login as:

```txt
CASHIER or OWNER
```

Create an order with:

```txt
1 or more menu items
Known price
Known quantity
Known tax/service behavior
```

Expected backend/database:

```txt
Order is created.
OrderItem rows are created.
Order belongs to correct restaurantId.
Order total is backend-calculated.
```

## Test 5.2: Complete Payment

Pay the order using enabled payment method.

Expected backend/database:

```txt
Payment is created.
Order becomes PAID or completed through expected flow.
Payment amount matches backend total.
CashflowEntry is created or synced for ORDER_PAYMENT.
CashflowEntry amount matches paid amount.
CashflowEntry is scoped to restaurantId.
```

## Test 5.3: Verify Financial Report Revenue

Open Financial Reports for the same period.

Expected:

```txt
totalRevenue increases.
cashIn increases.
orderCount increases.
averageOrderValue updates.
Cash In table includes order/payment source.
No frontend calculation needed.
```

---

# Suite 6: Kitchen and Serving Flow

## Test 6.1: Paid Order Appears in Kitchen

After payment:

```txt
Open KDS/Kitchen dashboard.
```

Expected:

```txt
Paid order appears for kitchen.
Kitchen can start preparing.
Kitchen can mark ready.
Status transition follows backend rules.
```

## Test 6.2: Ready Order Appears in Serving

After kitchen marks ready:

```txt
Open Serving dashboard.
```

Expected:

```txt
Ready order appears.
Server can mark served/completed according to allowed flow.
Backend enforces transition.
```

## Test 6.3: Completed Order Remains in Financial Report

After serving/completion:

```txt
Open Financial Reports.
```

Expected:

```txt
Revenue remains counted.
Cash In remains counted.
Order is not duplicated.
```

---

# Suite 7: Duplicate Payment Prevention

## Test 7.1: Try Paying Same Order Twice

Use an already paid order.

Attempt:

```txt
Create another payment for the same order.
```

Expected:

```txt
Backend rejects duplicate payment or prevents duplicate cashflow sync.
Financial report must not double count revenue.
Cash In table must not duplicate payment.
Source health must not hide duplicate issue if duplicate prevention fails.
```

---

# Suite 8: Expense to Cash Out and Net Profit

## Test 8.1: Create Expense Cashflow

Create cashflow entry:

```txt
type/category = EXPENSE or equivalent
amount = known amount
status = POSTED or equivalent active status
date = inside report period
```

Expected backend/database:

```txt
CashflowEntry is created.
Entry is scoped to restaurantId.
Entry amount is stored correctly.
Entry is not voided.
```

## Test 8.2: Verify Financial Report Expense

Open Financial Reports.

Expected:

```txt
cashOut increases.
totalExpenses increases if expense is included in report basis.
netCashflow decreases.
netProfit decreases where applicable.
Cash Out table includes expense row.
```

---

# Suite 9: Inventory Usage to COGS

## Test 9.1: Prepare Menu Recipe

Make sure menu item has recipe ingredients.

Expected database:

```txt
Recipe links MenuItem to InventoryItem.
InventoryItem has cost/unit cost data.
```

## Test 9.2: Sell Menu Item

Create and pay order containing menu item with recipe.

Expected backend/database:

```txt
StockMovement OUT or RECIPE_USAGE is created.
StockMovement has unitCostSnapshot.
Inventory quantity decreases.
```

## Test 9.3: Verify COGS

Open Financial Reports.

Expected:

```txt
COGS increases.
Gross profit = revenue - COGS.
Gross margin updates.
No frontend-side COGS calculation.
```

---

# Suite 10: Missing Cost Snapshot Reconciliation

## Test 10.1: Create or Simulate Missing Cost Snapshot

Create stock movement OUT/RECIPE_USAGE without unitCostSnapshot, only in test environment.

Expected:

```txt
Stock movement exists.
unitCostSnapshot is null or missing.
```

## Test 10.2: Verify Source Health

Open Financial Reports.

Expected:

```txt
sourceHealth.stockMovementsMissingCostSnapshot > 0.
sourceHealth.warnings includes missing cost snapshot warning.
```

## Test 10.3: Verify Reconciliation

Open reconciliation panel or call:

```txt
GET /api/financial-reports/reconciliation
```

Expected:

```txt
Issue missing_cost_snapshot appears.
missingCostSnapshots table contains detail row.
Severity is warning or critical according to backend rules.
```

---

# Suite 11: Paid Order Without Cashflow Reconciliation

## Test 11.1: Simulate Paid Order Without Cashflow

In test environment, create or locate paid order with no matching cashflow entry.

Expected database:

```txt
Order is paid.
No matching CashflowEntry exists for that order/payment source.
```

## Test 11.2: Verify Source Health

Open Financial Reports.

Expected:

```txt
sourceHealth.ordersWithoutCashflow > 0.
sourceHealth.warnings includes order/cashflow sync warning.
```

## Test 11.3: Verify Reconciliation

Open reconciliation.

Expected:

```txt
Issue orders_without_cashflow appears.
unsyncedOrders table contains detail row.
```

---

# Suite 12: Pending Cashflow Reconciliation

## Test 12.1: Create Pending Cashflow Entry

Create cashflow entry with pending status inside period.

Expected database:

```txt
CashflowEntry status = PENDING.
Entry is scoped to restaurantId.
```

## Test 12.2: Verify Financial Report

Open Financial Reports.

Expected:

```txt
sourceHealth.pendingCashflowEntries > 0.
Warning appears.
Pending entry does not incorrectly count as final posted cashflow if backend rules exclude pending.
```

## Test 12.3: Verify Reconciliation

Expected:

```txt
Issue pending_cashflow_entries appears.
pendingCashflowEntries table contains row.
```

---

# Suite 13: Voided Cashflow Reconciliation

## Test 13.1: Create Voided Cashflow Entry

Create or void a cashflow entry inside period.

Expected database:

```txt
CashflowEntry status = VOIDED.
Entry remains auditable.
```

## Test 13.2: Verify Financial Report

Expected:

```txt
sourceHealth.voidedCashflowEntries > 0.
Voided entry does not incorrectly count as active cash in/out.
```

## Test 13.3: Verify Reconciliation

Expected:

```txt
Issue voided_cashflow_entries appears.
voidedCashflowEntries table contains row.
```

---

# Suite 14: Invoice Receivables

## Test 14.1: Create Draft Invoice

Create invoice:

```txt
status = DRAFT
grandTotal = known amount
invoiceDate = inside period
dueDate = future date
```

Expected database:

```txt
Invoice is scoped to restaurantId.
Invoice status is DRAFT.
Invoice grandTotal stored correctly.
```

## Test 14.2: Verify Financial Report Receivables

Open Financial Reports.

Expected:

```txt
receivables increases.
Receivables table includes invoice.
sourceHealth warnings include open receivables if applicable.
```

## Test 14.3: Send Invoice

Change invoice status to:

```txt
SENT
```

Expected:

```txt
Invoice remains in receivables.
Open receivables reconciliation issue may appear.
```

## Test 14.4: Pay Invoice

Change invoice status to:

```txt
PAID
```

Expected:

```txt
Invoice no longer appears as open receivable.
Receivables decreases.
If invoice payment syncs cashflow, cashIn may increase according to backend rules.
```

---

# Suite 15: Overdue Receivables

## Test 15.1: Create Overdue Invoice

Create invoice:

```txt
status = SENT
dueDate = date before today
grandTotal > 0
```

Expected:

```txt
Invoice is open and overdue.
```

## Test 15.2: Verify Reconciliation

Open reconciliation.

Expected:

```txt
Issue overdue_receivables appears.
Severity is critical.
openReceivables table includes overdue invoice.
Description identifies invoice as overdue.
```

---

# Suite 16: Export JSON

## Test 16.1: Export JSON as OWNER

Login:

```txt
OWNER
```

Call:

```txt
GET /api/financial-reports/export?format=json
```

Expected:

```txt
Response status 200.
contentType is application/json;charset=utf-8.
Response includes report object.
Response includes auditLogged true.
Report payload includes summary, profitLoss, trend, bestSellingProducts, cashIn, cashOut, receivables, sourceHealth.
```

## Test 16.2: Export JSON as MANAGER

Expected:

```txt
Response status 200.
Same payload structure.
```

## Test 16.3: Export JSON as CASHIER/KITCHEN/SERVER

Expected:

```txt
Response status 403.
No report payload leaked.
```

---

# Suite 17: Export CSV

## Test 17.1: Export CSV as OWNER

Call:

```txt
GET /api/financial-reports/export?format=csv
```

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

Expected:

```txt
Response status 200.
contentType is text/csv;charset=utf-8.
content is non-empty.
auditLogged is true.
CSV values match backend report response for same period/basis.
```

## Test 17.2: Export CSV Escaping

Use data with comma or quote in description/customer/source name.

Expected:

```txt
CSV escapes comma and quotes correctly.
CSV remains parseable in spreadsheet tools.
```

## Test 17.3: Export CSV as Unauthorized Role

Login as:

```txt
CASHIER
KITCHEN
SERVER
```

Expected:

```txt
403.
No CSV content leaked.
```

---

# Suite 18: Export Audit Log

## Test 18.1: Export Creates Audit Log

As OWNER or MANAGER, export JSON or CSV.

Expected database:

```txt
AuditLog row exists.
Action identifies financial report export.
Entity/source identifies financial report export.
Metadata includes format, filename, period, basis where implemented.
restaurantId matches current business.
userId matches exporting user.
```

## Test 18.2: Failed Unauthorized Export Does Not Leak Data

As CASHIER, attempt export.

Expected:

```txt
403.
No report data leaked.
Audit behavior follows security policy.
```

---

# Suite 19: Tenant Isolation

## Test 19.1: Restaurant A Cannot See Restaurant B Report

Setup:

```txt
Restaurant A has paid orders.
Restaurant B has different paid orders.
```

Login as Restaurant A OWNER.

Expected:

```txt
Financial report only includes Restaurant A data.
No Restaurant B order, payment, cashflow, invoice, or stock movement appears.
```

## Test 19.2: Reconciliation Is Tenant Scoped

Expected:

```txt
Reconciliation issues only come from current restaurantId.
No cross-tenant source health counts.
```

## Test 19.3: Export Is Tenant Scoped

Expected:

```txt
CSV/JSON export only contains current restaurant data.
```

---

# Suite 20: Frontend Anti-Fake Data Regression

## Test 20.1: Search for Hardcoded Financial Rows

Search frontend files for old fake values, demo products, or static cashflow rows.

Examples:

```txt
116_400_000
Chicken Rice Bowl
sixMonthTrend
cashInRows
cashOutRows
bestSellingProducts mock data
```

Expected:

```txt
No fake dashboard report data remains.
```

## Test 20.2: API Failure Does Not Show Fake Data

Stop backend API and open dashboard.

Expected:

```txt
Error state appears.
No fake KPI cards.
No fake chart/table rows.
No export from fake report.
```

---

# Suite 21: Source Health Consistency

## Test 21.1: Source Health Matches Reconciliation

Create test inconsistencies:

```txt
Paid order without cashflow
Stock movement missing cost snapshot
Pending cashflow
Voided cashflow
Open receivable
Overdue receivable
```

Expected:

```txt
Financial report sourceHealth counts match reconciliation issue counts.
Warnings align with reconciliation issue categories.
Detail rows explain the issue.
```

## Test 21.2: Clean Data Produces Clean Source Health

Use period with clean synced data.

Expected:

```txt
sourceHealth warnings empty or non-critical.
Reconciliation issues empty.
Detail tables empty.
Dashboard empty states visible.
```

---

# Suite 22: UI Usability Smoke

## Test 22.1: Dashboard Responsiveness

Open Financial Reports on:

```txt
Desktop width
Tablet width
Mobile width
```

Expected:

```txt
Cards stack properly.
Tables remain readable or horizontally scrollable.
Buttons remain accessible.
No layout overlap.
```

## Test 22.2: Keyboard Navigation

Expected:

```txt
Period selector can be focused.
Basis selector can be focused.
Refresh button can be focused.
Export buttons can be focused.
No keyboard trap.
```

## Test 22.3: Error Message Clarity

Force API error.

Expected:

```txt
Error explains financial report issue.
Message is not only "undefined" or "Error".
```

---

# Suite 23: Regression Checklist After Every Financial Report Change

Run after changing any of these files:

```txt
financial-reports-api.ts
financial-reports-export-api.ts
financial-reports-reconciliation-api.ts
financial-reports-dashboard.tsx
report-service.ts
report-export.ts
reconciliation.ts
financial-reports.routes.ts
financial-reports.types.ts
```

Required regression:

```txt
Build frontend.
Build backend.
OWNER view report.
MANAGER view report.
CASHIER denied.
Create paid order.
Verify revenue.
Create expense.
Verify cash out.
Create invoice.
Verify receivable.
Export JSON.
Export CSV.
Check reconciliation.
Check sourceHealth.
Check no fake data appears.
```

---

# Bug Report Template

Use this format when a test fails:

```txt
## Bug Title

## Environment
Frontend:
Backend:
Database:
Branch:
Commit:

## Role Used
OWNER / MANAGER / CASHIER / KITCHEN / SERVER

## Test Case
Example: Suite 11.2 Verify Source Health

## Steps
1.
2.
3.

## Expected Result

## Actual Result

## Screenshots or Logs

## API Response

## Database Evidence

## Severity
Critical / High / Medium / Low

## Suspected Area
Frontend / Backend / Database / Permission / Export / Reconciliation

## Notes
```

---

# Future Automation Plan

Convert the manual checklist into automated tests in this order:

```txt
1. Backend permission tests
2. Backend financial report service tests
3. Backend reconciliation service tests
4. Export JSON/CSV integration tests
5. Frontend API client tests
6. Playwright OWNER dashboard happy path
7. Playwright role denial path
8. Playwright loading/error/empty state path
9. Tenant isolation integration tests
10. Audit log export tests
```

Recommended test types:

```txt
Unit test       -> pure formatting/query builder
Service test    -> financial report aggregation
Integration test -> API route + DB
E2E test        -> frontend + backend + test database
```

---

# Final Phase 9 Sign-Off

Phase 9 is complete when:

```txt
All build commands pass.
All role permission tests pass.
All financial report happy paths pass.
All reconciliation issue tests pass.
All export tests pass.
All tenant isolation checks pass.
All fake-data regression checks pass.
All failed tests are logged with bug report template.
```

Do not mark Phase 9 complete only because the dashboard visually loads. A financial report that renders but lies is worse than a page that crashes, because at least a crash has the decency to admit it failed.

