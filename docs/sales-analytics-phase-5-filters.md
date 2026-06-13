# Sales Analytics Phase 5 - Backend Filter Options and Real Filters

## Status

Implemented as a local patch package.

Phase 5 replaces the temporary product-name filter behavior with backend-driven product, category, payment method, and order status filters. The goal is to keep the frontend as a display/input layer while the backend decides the actual query scope.

## Scope

### Backend

- Add `categoryId`, `paymentMethod`, and `orderStatus` to `SalesAnalyticsQuery`.
- Add `SalesAnalyticsFilterOptionsDto`.
- Validate all filter inputs.
- Whitelist order status values to the paid lifecycle statuses only.
- Keep `paymentMethod` as a bounded string because the current Prisma schema stores payment method as `String`, not an enum.
- Apply filters in repository SQL for summary, rows, trend, busy hours, best sellers, and source health.
- Add `GET /api/sales-analytics/filter-options`.

### Frontend

- Add backend-backed product options.
- Add backend-backed category options.
- Add backend-backed payment method options.
- Add backend-backed order status options.
- Keep text search as `q`.
- Send `productId`, `categoryId`, `paymentMethod`, `orderStatus`, and `q` to the backend.

## Endpoint

```txt
GET /api/sales-analytics/filter-options
```

Returns:

```ts
type SalesAnalyticsFilterOptionsDto = {
  products: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  paymentMethods: { value: string; label: string }[];
  orderStatuses: { value: string; label: string }[];
};
```

## Query filters

```txt
productId
categoryId
paymentMethod
orderStatus
q
```

The backend applies these filters to sales analytics queries. The frontend no longer passes product names as product filters.

## COGS rule

COGS remains intentionally hidden when scoped filters are active:

```txt
productId
categoryId
paymentMethod
orderStatus
q
```

Reason: the current stock movement model is still order/date scoped, not exact item-cost scoped. Showing restaurant-wide or order-level COGS inside a product/category/payment/status filtered view would be misleading.

## Anti-patterns avoided

- No frontend-only product/category filtering.
- No product label used as product ID.
- No unbounded filter input.
- No arbitrary order status filter.
- No fake COGS for scoped analytics.
- No tenant-unscoped filter options.
- No hardcoded product/category option list.

## Manual test checklist

### Backend

```txt
GET /api/sales-analytics/filter-options -> 200 for OWNER/MANAGER
GET /api/sales-analytics/filter-options -> 403 for forbidden roles
GET /api/sales-analytics?productId=<id> -> filtered rows
GET /api/sales-analytics?categoryId=<id> -> filtered rows
GET /api/sales-analytics?paymentMethod=CASH -> filtered rows
GET /api/sales-analytics?orderStatus=COMPLETED -> filtered rows
GET /api/sales-analytics?orderStatus=CANCELLED -> 400
```

### Frontend

```txt
Product dropdown loads from backend.
Category dropdown loads from backend.
Payment method dropdown loads from backend.
Order status dropdown loads from backend.
Changing filters refetches backend report.
Scoped filters show source health COGS warning.
Empty states still work.
Export uses the same active filters.
Reconciliation uses the same active filters.
```

## Deferred

- Real product/category option search for very large menus.
- Server-side pagination and sorting.
- Item-level COGS allocation.
- Role-scoped operational analytics for CASHIER.
- Automated integration tests.
