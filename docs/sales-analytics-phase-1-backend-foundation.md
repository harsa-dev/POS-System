# Sales Analytics Phase 1: Backend Foundation

Phase 1 moves Shared Sales Analytics away from being a purely frontend-only concept by adding a real backend contract, permission guard, route, repository aggregation, and frontend API client contract.

This phase intentionally does not replace the existing dashboard UI yet. The current UI is already usable visually, but it still needs a later wiring phase to replace frontend mock rows with backend data.

## Scope

Implemented in this phase:

- Backend permission keys for sales analytics.
- Backend view/export guards.
- Sales analytics query validation.
- Sales analytics DTO contract.
- Sales analytics repository queries.
- Sales analytics service assembly.
- Express route for sales analytics.
- Route index registration.
- Frontend API client contract.

Not implemented in this phase:

- Replacing hardcoded frontend dashboard data.
- CSV export.
- Server-side pagination/cursor pagination.
- Product-level COGS allocation.
- Automated E2E tests.

## Backend Endpoint

```txt
GET /api/sales-analytics?from=&to=&basis=paid&productId=&q=&limit=
GET /api/sales-analytics/export?from=&to=&basis=paid&productId=&q=&limit=
```

The route uses existing authentication and business context resolution:

```txt
requireRole(req, res, ALL_ROLES)
requireBusinessContextForUser(user)
requireSalesAnalyticsView(role)
requireSalesAnalyticsExport(role)
```

Only OWNER and MANAGER currently receive full sales analytics permissions.

## Permission Keys

```txt
shared.analytics.view
shared.analytics.export
```

Allowed roles:

```txt
OWNER   -> view + export
MANAGER -> view + export
CASHIER -> denied
KITCHEN -> denied
SERVER  -> denied
```

This keeps profit, margin, COGS, and net profit away from operational roles until a limited analytics view is explicitly designed.

## Data Sources

Phase 1 reads from existing database tables:

```txt
Order
OrderItem
MenuItem
Category
Payment
StockMovement
```

No migration was added.

## Query Rules

Validation rules:

```txt
basis defaults to paid
basis allowed values: paid
from defaults to current month start
to defaults to end of today
max range: 400 days
limit defaults to 50
max limit: 100
q max length: 80 characters
```

The backend rejects invalid date ranges and invalid query values.

## Repository Rules

The repository uses scoped, parameterized SQL aggregation.

All analytics queries must include:

```txt
restaurantId
from/to date range
paid lifecycle order status
```

Paid lifecycle order statuses:

```txt
PAID
PREPARING
READY
SERVED
COMPLETED
```

These statuses exclude pending and cancelled orders from sales analytics.

## Response Contract

```ts
SalesAnalyticsDto = {
  period: {
    from: string;
    to: string;
    label: string;
  };
  basis: "paid";
  generatedAt: string;
  summary: {
    grossRevenue: number;
    totalDiscount: number;
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    margin: number;
    netProfit: number;
    quantity: number;
    transactionCount: number;
    orderCount: number;
    averageOrderValue: number;
    receivables: number;
  };
  rows: SalesTransactionDto[];
  dailyTrend: SalesAnalyticsDataPointDto[];
  busyHours: SalesAnalyticsDataPointDto[];
  bestSellingProducts: SalesAnalyticsDataPointDto[];
  sourceHealth: SalesAnalyticsSourceHealthDto;
}
```

## COGS Rule

Summary COGS is read from StockMovement rows using RECIPE_USAGE movements with unitCostSnapshot.

Product-filtered COGS is not calculated yet because current stock movements are not safely linked to specific OrderItem rows.

When productId or q is used:

```txt
summary.cogs = 0
sourceHealth.warnings includes product-filtered COGS caveat
```

This avoids showing total restaurant COGS beside product-filtered revenue, because that would create a misleading report. Software already lies enough when humans write requirements, so the backend should not help.

## Source Health

Source health currently returns:

```txt
paidOrders
orderItems
paidPayments
stockMovements
ordersWithoutPayment
stockMovementsMissingCostSnapshot
warnings
```

Warnings currently cover:

```txt
Paid orders without order items
Paid lifecycle orders without paid payment rows
Stock movements missing unitCostSnapshot
Product-filtered analytics with hidden COGS
```

## Frontend Contract

Added:

```txt
artifacts/pos-system/src/lib/api/sales-analytics-api.ts
```

The frontend client includes:

```txt
salesAnalyticsApi.getReport(params)
salesAnalyticsBases
isSalesAnalyticsBasis(value)
buildSalesAnalyticsQueryString(params)
SalesAnalyticsDto types
```

The existing dashboard is not wired to this client yet.

## Anti-Pattern Checks

Avoided in Phase 1:

- No frontend business calculation added.
- No fake backend rows.
- No schema mutation just for UI.
- No route-level giant business logic.
- No unscoped tenant query.
- No unlimited row fetch.
- No CASHIER/KITCHEN/SERVER access to full profit analytics.
- No product-filtered COGS lie.

## Manual Test Checklist

Backend:

```txt
[ ] OWNER can GET /api/sales-analytics
[ ] MANAGER can GET /api/sales-analytics
[ ] CASHIER gets 403
[ ] KITCHEN gets 403
[ ] SERVER gets 403
[ ] Invalid date returns 400
[ ] from > to returns 400
[ ] range > 400 days returns 400
[ ] limit > 100 returns 400
[ ] q > 80 chars returns 400
[ ] Response is scoped to current restaurantId
[ ] Cancelled/pending orders are excluded
[ ] Paid lifecycle orders are included
[ ] rows length respects limit
[ ] bestSellingProducts max 10
[ ] sourceHealth warnings appear when data is inconsistent
```

Frontend client:

```txt
[ ] salesAnalyticsApi.getReport() hits /api/sales-analytics
[ ] query string includes from/to/basis/productId/q/limit when provided
[ ] invalid basis is rejected by isSalesAnalyticsBasis
```

## Deferred Work

Phase 2 should wire the existing SalesAnalyticsDashboard to the backend client:

```txt
- Remove salesRows mock data.
- Remove frontend summary calculation.
- Add loading/error/empty state.
- Use backend rows, summary, trend, busy hours, best sellers, source health.
- Keep current UI layout if possible.
```

Later phases:

```txt
- Backend CSV export.
- Server-side pagination.
- Product-level COGS allocation.
- Automated service tests.
- Frontend E2E test for sales analytics.
- Role-specific limited analytics for CASHIER if needed.
```
