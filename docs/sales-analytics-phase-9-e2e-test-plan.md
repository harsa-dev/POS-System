# Sales Analytics Phase 9: E2E Test Plan and Manual Verification

## Status

Phase 9 documents the end-to-end and manual verification plan for Sales Analytics. It does not add new product behavior. The goal is to make the analytics module testable, repeatable, and safe to refactor after phases 1-8.

This document is intentionally strict because analytics bugs are quiet. A broken dashboard does not always crash. Sometimes it just shows a believable lie, which is worse because humans will put it in a slide deck and call it insight.

## Scope

Sales Analytics currently covers:

- Backend report calculation.
- Backend export and audit.
- Source health and reconciliation.
- Product/category/payment/status/search/date filters.
- Server-side pagination and sorting.
- COGS allocation from order-level stock movement snapshots.
- Role-scoped operational/profit views.
- Frontend loading, error, empty, filter, export, table, and restricted-view states.

## Out of scope

These are not part of Phase 9 implementation:

- Writing automated Vitest/Playwright tests.
- Adding a test database setup.
- Adding CI workflows.
- Adding new analytics features.
- Adding item-level COGS snapshots.
- Adding cursor pagination.
- Adding rate limit middleware.

Those belong to later hardening work. Phase 9 makes the checklist clear first, because apparently even robots need written instructions so humans do not “test based on vibes.”

## Required prerequisites

Before running this plan, make sure these commands pass locally:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/pos-system run build
```

Recommended static checks:

```bash
pnpm --filter @workspace/api-server run lint
pnpm --filter @workspace/pos-system run lint
pnpm --filter @workspace/api-server exec prisma validate
```

If any of these fail, do not continue E2E testing. Fix the build first. Testing a broken build is not quality assurance. It is archaeology.

## Test data setup

Use a non-production database.

Create at least two restaurants:

```txt
Restaurant A
Restaurant B
```

Create users:

```txt
OWNER_A
MANAGER_A
CASHIER_A
KITCHEN_A
SERVER_A
OWNER_B
```

Create menu/category data for Restaurant A:

```txt
Category: Food
Category: Drink
Product: Nasi Goreng, category Food
Product: Ayam Bakar, category Food
Product: Es Teh, category Drink
Product: Kopi, category Drink
```

Create inventory/recipe data where possible:

```txt
Rice -> Nasi Goreng
Chicken -> Ayam Bakar
Tea -> Es Teh
Coffee -> Kopi
```

Create orders across different statuses:

```txt
COMPLETED order with CASH payment
SERVED order with QRIS payment
READY order with CARD payment
PAID order with TRANSFER payment
WAITING_PAYMENT order
CANCELLED order
REJECTED order
```

Create enough paid lifecycle orders to test pagination:

```txt
At least 25 paid lifecycle order items
```

Paid lifecycle status for analytics:

```txt
PAID
PREPARING
READY
SERVED
COMPLETED
```

Cancelled/rejected/waiting orders must not be counted as paid sales revenue.

## Backend API contract tests

### 1. Base report endpoint

Endpoint:

```txt
GET /api/sales-analytics
```

Expected for OWNER/MANAGER:

```txt
200 OK
response.data.summary exists
response.data.rows exists
response.data.dailyTrend exists
response.data.busyHours exists
response.data.bestSellingProducts exists
response.data.sourceHealth exists
response.data.pagination exists
response.data.access exists
```

Expected for CASHIER after role-scoped views:

```txt
200 OK if operational-view is enabled
access.canViewOperational = true
access.canViewProfit = false
access.canExport = false
profit fields are null
```

Expected for KITCHEN/SERVER:

```txt
403 Forbidden
```

### 2. Invalid query validation

Requests:

```txt
GET /api/sales-analytics?basis=random
GET /api/sales-analytics?from=not-a-date
GET /api/sales-analytics?page=0
GET /api/sales-analytics?pageSize=999
GET /api/sales-analytics?sortBy=invalid
GET /api/sales-analytics?sortDirection=sideways
```

Expected:

```txt
400 Bad Request
consistent validation error response
```

### 3. Date range

Requests:

```txt
GET /api/sales-analytics?from=<today>&to=<today>
GET /api/sales-analytics?from=<month-start>&to=<today>
```

Expected:

```txt
Only orders within the requested date range are counted.
period.from and period.to match normalized backend period.
```

### 4. Product filter

Request:

```txt
GET /api/sales-analytics?productId=<nasi-goreng-id>
```

Expected:

```txt
Only Nasi Goreng rows are returned.
Summary quantity equals only Nasi Goreng quantity.
Summary revenue equals only Nasi Goreng revenue.
COGS is allocated, not forced to 0.
Source health warning explains COGS allocation if applicable.
```

### 5. Category filter

Request:

```txt
GET /api/sales-analytics?categoryId=<food-category-id>
```

Expected:

```txt
Rows contain only Food category products.
Drink products are excluded.
Summary reflects only Food rows.
```

### 6. Payment method filter

Requests:

```txt
GET /api/sales-analytics?paymentMethod=CASH
GET /api/sales-analytics?paymentMethod=QRIS
GET /api/sales-analytics?paymentMethod=CARD
GET /api/sales-analytics?paymentMethod=TRANSFER
```

Expected:

```txt
Rows only include matching payment method.
Summary matches filtered method.
```

### 7. Order status filter

Requests:

```txt
GET /api/sales-analytics?orderStatus=PAID
GET /api/sales-analytics?orderStatus=COMPLETED
GET /api/sales-analytics?orderStatus=CANCELLED
```

Expected:

```txt
PAID -> 200 OK, rows only PAID.
COMPLETED -> 200 OK, rows only COMPLETED.
CANCELLED -> 400 Bad Request or rejected by whitelist.
```

Cancelled and rejected statuses should not be allowed as paid analytics filters unless a future analytics mode explicitly supports non-paid operational analysis.

## Pagination and sorting tests

### 1. Pagination page 1

Request:

```txt
GET /api/sales-analytics?page=1&pageSize=10
```

Expected:

```txt
rows.length <= 10
pagination.page = 1
pagination.pageSize = 10
pagination.totalRows >= rows.length
pagination.totalPages >= 1
```

### 2. Pagination page 2

Request:

```txt
GET /api/sales-analytics?page=2&pageSize=10
```

Expected:

```txt
rows are different from page 1 if totalRows > 10
pagination.page = 2
```

### 3. Sort by total revenue descending

Request:

```txt
GET /api/sales-analytics?sortBy=totalRevenue&sortDirection=desc&pageSize=20
```

Expected:

```txt
Rows are ordered by totalRevenue descending.
```

### 4. Sort by product name ascending

Request:

```txt
GET /api/sales-analytics?sortBy=productName&sortDirection=asc&pageSize=20
```

Expected:

```txt
Rows are ordered alphabetically by productName.
```

### 5. Sort by margin with restricted role

As CASHIER:

```txt
GET /api/sales-analytics?sortBy=margin&sortDirection=desc
```

Expected:

```txt
Backend either allows sorting but masks margin values, or rejects profit-only sort for non-profit role if implemented later.
No visible margin value leaks in response.
```

If current implementation allows sort but masks values, document it as accepted MVP behavior.

## Source health and reconciliation tests

### 1. Reconciliation endpoint

Endpoint:

```txt
GET /api/sales-analytics/reconciliation
```

Expected for OWNER/MANAGER:

```txt
200 OK
issues array exists
detail row arrays exist
period exists
generatedAt exists
```

Expected for CASHIER:

```txt
200 OK if operational-view is allowed
No profit fields leaked through reconciliation response.
```

Expected for KITCHEN/SERVER:

```txt
403 Forbidden
```

### 2. Paid lifecycle order without PAID payment

Create a paid lifecycle order with no PAID payment record.

Expected:

```txt
Reconciliation includes critical issue.
ordersWithoutPaidPayment includes the order.
```

### 3. Payment amount mismatch

Create order total 100000 but payment amount 90000.

Expected:

```txt
Reconciliation includes critical issue.
paymentTotalMismatches includes detail row.
```

### 4. Missing stock movement unit cost snapshot

Create RECIPE_USAGE stock movement with null unitCostSnapshot.

Expected:

```txt
Source health warning exists.
Reconciliation missingCostSnapshots includes detail row.
```

### 5. Stock movement without order source link

Create RECIPE_USAGE stock movement without sourceId or with unsupported sourceType.

Expected:

```txt
sourceHealth.stockMovementsWithoutOrderSource > 0
warning says allocated COGS may be understated.
```

## COGS and profit tests

### 1. Base COGS calculation

Create order with item subtotal and linked stock movement:

```txt
Order total: 100000
Order item A subtotal: 70000
Order item B subtotal: 30000
Order-level COGS: 40000
```

Expected allocation:

```txt
Item A COGS = 28000
Item B COGS = 12000
```

Expected:

```txt
Summary COGS = 40000
Gross profit = revenue - COGS
Margin = grossProfit / revenue * 100
```

### 2. Product scoped COGS

Filter by item A product.

Expected:

```txt
COGS is estimated using item revenue share.
COGS is not forced to 0.
Source health warning explains allocation.
```

### 3. Profit masking for CASHIER

Login as CASHIER.

Expected:

```txt
summary.cogs = null
summary.grossProfit = null
summary.margin = null
summary.netProfit = null
rows[].cogs = null
rows[].grossProfit = null
rows[].margin = null
```

No hidden frontend value should exist in rendered markup or response payload.

## Export and audit tests

### 1. JSON export as OWNER

Request:

```txt
GET /api/sales-analytics/export?format=json
```

Expected:

```txt
200 OK
filename exists
contentType = application/json
auditLogged = true
report exists
AuditLog row exists
```

### 2. CSV export as OWNER

Request:

```txt
GET /api/sales-analytics/export?format=csv
```

Expected:

```txt
200 OK
filename ends with .csv
contentType = text/csv; charset=utf-8
content exists
content includes metadata section
content includes summary section
content includes rows section
AuditLog row exists
```

### 3. Export as MANAGER

Expected:

```txt
200 OK
auditLogged = true
```

### 4. Export as CASHIER

Expected:

```txt
403 Forbidden
No AuditLog success row is created.
No profit fields leak.
```

### 5. Invalid export format

Request:

```txt
GET /api/sales-analytics/export?format=pdf
```

Expected:

```txt
400 Bad Request
```

## Role permission matrix

| Role | View operational analytics | View COGS/profit/margin | Export analytics | Expected result |
| --- | --- | --- | --- | --- |
| OWNER | Yes | Yes | Yes | Full analytics |
| MANAGER | Yes | Yes | Yes | Full analytics |
| CASHIER | Yes | No | No | Operational-only |
| KITCHEN | No | No | No | 403/no module access |
| SERVER | No | No | No | 403/no module access |

Every role must have positive and negative tests. Negative tests matter more for security because data leaks do not politely announce themselves.

## Tenant isolation tests

Use OWNER_A and OWNER_B.

### 1. Restaurant A cannot see Restaurant B analytics

Login as OWNER_A and call:

```txt
GET /api/sales-analytics
```

Expected:

```txt
Only Restaurant A orders are counted.
No Restaurant B order numbers/products appear.
```

### 2. Restaurant A filter with Restaurant B product ID

Request as OWNER_A:

```txt
GET /api/sales-analytics?productId=<restaurant-b-product-id>
```

Expected:

```txt
200 OK with empty result, or validation/permission rejection if implemented.
No Restaurant B data leaks.
```

### 3. Restaurant A export cannot include Restaurant B data

Request as OWNER_A:

```txt
GET /api/sales-analytics/export?format=csv
```

Expected:

```txt
CSV contains only Restaurant A data.
AuditLog restaurantId = Restaurant A.
```

## Frontend E2E checklist

Run in browser against local backend.

### OWNER flow

```txt
[ ] Login as OWNER.
[ ] Open /dashboard/analytics.
[ ] Loading state appears while fetching.
[ ] Summary cards appear.
[ ] Profit cards appear.
[ ] Source health appears.
[ ] Reconciliation panel appears.
[ ] Product filter loads options.
[ ] Category filter loads options.
[ ] Payment method filter loads options.
[ ] Order status filter loads options.
[ ] Search changes query.
[ ] Pagination next/previous calls backend.
[ ] Sorting headers call backend.
[ ] Export CSV downloads backend CSV.
[ ] Error state appears if backend is stopped.
[ ] Empty state appears for a filter with no data.
```

### MANAGER flow

```txt
[ ] Login as MANAGER.
[ ] Open analytics.
[ ] Profit fields visible.
[ ] Export CSV enabled.
[ ] Filters work.
```

### CASHIER flow

```txt
[ ] Login as CASHIER.
[ ] Analytics module is visible only if operational-view is enabled.
[ ] Profit cards are hidden.
[ ] COGS/Gross Profit/Margin table columns are hidden.
[ ] Export CSV is disabled or unavailable.
[ ] API response has access.canViewProfit = false.
[ ] API response has profit fields null.
```

### KITCHEN/SERVER flow

```txt
[ ] Login as KITCHEN.
[ ] Analytics module is not visible, or API returns 403.
[ ] Login as SERVER.
[ ] Analytics module is not visible, or API returns 403.
```

## Manual database evidence checklist

For each analytics test, collect evidence from DB:

```txt
[ ] Order ids used in test.
[ ] Payment ids used in test.
[ ] OrderItem ids used in test.
[ ] StockMovement ids used in test.
[ ] AuditLog ids created by export.
[ ] restaurantId of each row.
```

Do not use production data. Do not use shared staging data without cleanup. Future-you should not have to become a forensic accountant because present-you was lazy.

## Expected bug report template

Use this format when a test fails:

```md
## Bug title

## Environment
- Branch:
- Commit:
- Browser:
- Backend URL:
- Database:

## Role
OWNER / MANAGER / CASHIER / KITCHEN / SERVER

## Steps to reproduce
1.
2.
3.

## Expected result

## Actual result

## API request

## API response

## DB evidence

## Screenshot / screen recording

## Severity
Critical / High / Medium / Low

## Suspected area
Frontend / Backend / Database / Permission / COGS / Export / Reconciliation
```

## Minimum pass criteria

Phase 9 is considered passed when:

```txt
[ ] Static checks pass.
[ ] OWNER analytics flow passes.
[ ] MANAGER analytics flow passes.
[ ] CASHIER operational-only flow passes.
[ ] KITCHEN/SERVER negative access passes.
[ ] Tenant isolation passes.
[ ] Product/category/payment/status/search filters pass.
[ ] Pagination and sorting pass.
[ ] COGS allocation checks pass.
[ ] Reconciliation checks pass.
[ ] JSON export and CSV export pass.
[ ] Export audit log passes.
[ ] Empty/loading/error states are verified.
[ ] All failed checks have bug reports.
```

## Deferred automation plan

After manual verification, convert the highest-risk checks into automated tests:

```txt
1. Unit test permission matrix.
2. Unit test COGS allocation formulas.
3. Integration test sales analytics summary.
4. Integration test product/category/payment/status filters.
5. Integration test role masking.
6. Integration test export audit log.
7. Integration test tenant isolation.
8. Playwright E2E smoke test for OWNER dashboard.
9. Playwright E2E negative test for CASHIER profit masking.
10. CI job for typecheck/build/test.
```

## Notes for future phases

Phase 10 should harden:

- UX polish.
- Performance and query review.
- Rate limiting for export/report endpoints.
- Automated tests for the most important Phase 9 cases.
- CI enforcement.
- Docs finalization.

Do not skip Phase 9. Analytics without verification is just decorative arithmetic.