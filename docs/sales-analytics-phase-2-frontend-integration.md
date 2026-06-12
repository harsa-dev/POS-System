# Sales Analytics Phase 2: Frontend Integration

Phase 2 wires the existing Shared Sales Analytics dashboard to the backend foundation from Phase 1.

The dashboard is still visually the same module, but the data source changed from frontend mock arrays to the backend `/api/sales-analytics` endpoint.

## Scope

- Replace hardcoded dashboard rows with backend data.
- Keep the existing shared dashboard UI structure.
- Keep financial calculations on the backend.
- Add loading, error, empty, and refresh states.
- Keep export based on loaded backend rows.
- Do not change database schema.
- Do not change backend aggregation logic in this phase.

## Files Changed

```txt
artifacts/pos-system/src/features/shared/sales/sales-analytics-dashboard.tsx
```

## Backend Contract Used

```txt
GET /api/sales-analytics?from=&to=&basis=paid&q=&limit=
```

The frontend uses:

```txt
salesAnalyticsApi.getReport(query)
```

The response fields used by the dashboard:

```txt
period
summary
rows
dailyTrend
busyHours
bestSellingProducts
sourceHealth
```

## Frontend Data Flow

```txt
SalesAnalyticsDashboard
  -> dateRange/product/search state
  -> SalesAnalyticsQuery
  -> salesAnalyticsApi.getReport(query)
  -> backend /api/sales-analytics
  -> render summary/cards/table/charts/source health
```

## Removed Frontend Mock Data

The dashboard no longer owns these mock datasets:

```txt
salesRows
busyHours
dailyTrend
bestSellingProducts
```

Those values now come from backend response data.

## Removed Frontend Financial Calculations

The dashboard no longer calculates final analytics totals with frontend finance helpers.

Removed frontend responsibilities:

```txt
calculateRevenue()
calculateCOGS()
calculateGrossProfit()
calculateMargin()
calculateNetProfit()
calculateAverageOrderValue()
```

The backend now owns:

```txt
grossRevenue
totalRevenue
cogs
grossProfit
margin
netProfit
quantity
transactionCount
orderCount
averageOrderValue
```

Frontend only formats and displays those values.

## Filters

### Date Range

The existing date range UI maps to backend query dates.

```txt
Today      -> start of today to end of today
This Week  -> start of current week to end of today
This Month -> first day of current month to end of today
Custom Range -> temporary fallback to current month until a real date picker exists
```

### Product Filter and Search

The existing API supports `q`, not a full product-list endpoint yet.

Current behavior:

```txt
Product search has priority.
If search is empty and selected product is not All Products, the selected product name is sent as q.
```

This keeps the report backend-backed while avoiding fake frontend product filtering.

## Loading State

When no report has loaded yet, the dashboard shows:

```txt
Loading backend sales analytics data...
```

When a refresh happens while old data exists, the refresh action shows:

```txt
Refreshing...
```

## Error State

If the API request fails, the dashboard shows a visible error panel:

```txt
Failed to load sales analytics
```

No fake metrics are rendered as fallback data.

## Empty State

If backend rows are empty, the Sales Table shows:

```txt
No backend sales analytics rows for this filter yet.
```

Charts show:

```txt
No analytics data for the selected period yet.
```

## Source Health

The dashboard now renders backend source health:

```txt
Paid Orders
Order Items
Paid Payments
Stock Movements
Warnings
```

Warnings are displayed from `sourceHealth.warnings`, not fabricated in the frontend.

## Export

The Excel export still uses the shared frontend export utility, but the rows are now loaded backend rows.

Current export source:

```txt
report.rows
```

Deferred:

```txt
Backend CSV/XLS export endpoint for Sales Analytics
Audit log for sales analytics export
```

## Anti-Pattern Checks

Phase 2 avoids:

```txt
[x] hardcoded sales rows
[x] hardcoded busy hours
[x] hardcoded daily trend
[x] hardcoded best sellers
[x] frontend final financial summary calculation
[x] frontend fake data fallback on API failure
[x] frontend-only analytics permission enforcement
[x] tenant-unscoped analytics data
```

## Manual Test Checklist

Run:

```powershell
git pull origin main
pnpm --filter @workspace/pos-system run build
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
```

Then test:

```txt
OWNER opens /dashboard/analytics -> dashboard loads backend data.
MANAGER opens /dashboard/analytics -> dashboard loads backend data.
CASHIER calls /api/sales-analytics -> backend returns 403.
KITCHEN calls /api/sales-analytics -> backend returns 403.
SERVER calls /api/sales-analytics -> backend returns 403.
Change date range -> backend query updates.
Search product -> backend q query updates.
Refresh -> refetches backend data.
Backend stopped -> error state appears, no fake rows.
No sales in range -> empty states appear.
Export Excel -> exports loaded backend rows only.
Source health warning from backend -> warning appears in UI.
```

## Deferred Work

- Replace product-name search with real `productId` selection once a product options endpoint exists.
- Add real custom date picker.
- Add backend export for CSV/XLS/JSON.
- Add audit log for sales analytics export.
- Add server-side pagination when rows can exceed current backend `limit`.
- Add automated tests.
- Add limited operational analytics for CASHIER only if product requirement is clear.

## Phase 2 Status

```txt
Status: implemented, pending local build/typecheck/manual test
```
