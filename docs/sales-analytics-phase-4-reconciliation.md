# Sales Analytics Phase 4 - Source Health & Reconciliation

## Status

Phase 4 adds backend-driven reconciliation for Sales Analytics. The dashboard no longer only shows aggregate source health counts. It can now display backend integrity issues and detail rows for data problems that affect analytics correctness.

This phase is still MVP-safe: no database schema changes, no storage changes, no fake frontend reconciliation, and no client-side business truth.

## Scope

Implemented in this phase:

- Backend reconciliation DTO contract.
- Backend reconciliation service.
- `GET /api/sales-analytics/reconciliation` route.
- Frontend API client method.
- Sales Analytics dashboard reconciliation panel.
- Reconciliation detail tables with client-side pagination.
- No-store cache header on the reconciliation route.

## Backend Contract

Endpoint:

```txt
GET /api/sales-analytics/reconciliation?from=&to=&basis=paid&productId=&q=&limit=
```

The endpoint uses the same query validation as the main Sales Analytics report endpoint.

Response payload:

```ts
type SalesAnalyticsReconciliationDto = {
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  issues: SalesAnalyticsReconciliationIssueDto[];
  ordersWithoutPaidPayment: SalesAnalyticsReconciliationDetailRowDto[];
  paymentTotalMismatches: SalesAnalyticsReconciliationDetailRowDto[];
  missingCostSnapshots: SalesAnalyticsReconciliationDetailRowDto[];
  zeroRevenueRows: SalesAnalyticsReconciliationDetailRowDto[];
  cancelledOrdersInPeriod: SalesAnalyticsReconciliationDetailRowDto[];
};
```

## Reconciliation Checks

### 1. Paid lifecycle orders without PAID payment

Checks paid lifecycle orders that are included in sales analytics but do not have a `Payment` row with status `PAID`.

Severity: `critical`

Why it matters:

- Revenue may be counted without an actual payment record.
- Payment status and revenue can disagree.

### 2. Payment amount mismatch

Checks paid lifecycle orders where `Order.amountPaid` does not match `Order.total`.

Severity: `critical`

Why it matters:

- Paid order totals may not match collected payment amount.
- Cashier/payment sync may be wrong.

### 3. Missing cost snapshots

Checks recipe usage `StockMovement` rows with missing or invalid `unitCostSnapshot`.

Severity: `warning`

Why it matters:

- COGS, gross profit, and margin may be understated or misleading.

### 4. Zero or invalid order item values

Checks included order items with zero or negative `price`, `quantity`, or `subtotal`.

Severity: `warning`

Why it matters:

- Revenue, quantity, average order value, and margin can be wrong.

### 5. Product/search scoped COGS warning

If the query is filtered by product or search text, reconciliation adds an informational issue saying product-scoped COGS is hidden until item-level cost allocation exists.

Severity: `info`

Why it matters:

- Prevents showing restaurant-level COGS beside product-filtered revenue.

### 6. Cancelled orders in period

Lists cancelled orders in the same period. They are excluded from paid sales totals.

Severity: `info`

Why it matters:

- Explains why some orders in the period do not appear in analytics totals.

## Frontend Behavior

The Sales Analytics dashboard fetches:

```txt
/api/sales-analytics
/api/sales-analytics/reconciliation
```

Both are requested using the same date/product/search query.

The dashboard displays:

- Reconciliation issue cards.
- Severity badge.
- Issue counts.
- Detail tables for each issue category.
- Empty reconciliation state if no issues exist.

The frontend does not generate reconciliation issues by itself. It only renders backend response data.

## Permission Rules

The reconciliation endpoint uses the same view permission as Sales Analytics:

```txt
shared.analytics.view
```

Expected access:

- OWNER: allowed
- MANAGER: allowed
- CASHIER: forbidden
- KITCHEN: forbidden
- SERVER: forbidden

## Database Rules

This phase reads existing tables only:

- `Order`
- `Payment`
- `OrderItem`
- `MenuItem`
- `StockMovement`
- `InventoryItem`

No schema migration is required.

All reconciliation queries are scoped by `restaurantId` from the backend business context. Client-provided restaurant IDs are not accepted.

## Anti-patterns Avoided

- No frontend-generated reconciliation issues.
- No unscoped tenant queries.
- No fake backend rows.
- No hardcoded business totals.
- No database schema hacks.
- No caching of private reconciliation data.
- No product COGS lie.

## Manual Test Checklist

### API permission

```txt
OWNER   GET /api/sales-analytics/reconciliation -> 200
MANAGER GET /api/sales-analytics/reconciliation -> 200
CASHIER GET /api/sales-analytics/reconciliation -> 403
KITCHEN GET /api/sales-analytics/reconciliation -> 403
SERVER  GET /api/sales-analytics/reconciliation -> 403
```

### Query validation

```txt
GET /api/sales-analytics/reconciliation?from=bad-date -> 400
GET /api/sales-analytics/reconciliation?limit=999 -> 400
GET /api/sales-analytics/reconciliation?basis=random -> 400
```

### Source health cases

Create or inspect rows for:

- Paid lifecycle order without PAID payment.
- Paid lifecycle order with amountPaid different from total.
- Recipe usage stock movement without unitCostSnapshot.
- Order item with invalid zero value.
- Cancelled order in the selected period.

Expected:

- Issue appears in `issues`.
- Detail row appears in the correct detail array.
- Detail arrays are capped.
- Dashboard displays issue cards and detail tables.

### Product/search query

```txt
GET /api/sales-analytics/reconciliation?q=nasi
```

Expected:

- Response includes `product_scoped_cogs_hidden` info issue.

## Deferred

- Automated integration tests.
- Reconciliation export.
- Dedicated reconciliation route-level rate limit.
- More granular item-level COGS allocation.
- Payment provider external reconciliation.
- Cashflow sync reconciliation for sales analytics.
