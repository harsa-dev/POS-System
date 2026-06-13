# Sales Analytics Phase 6: Server-side Pagination & Sorting

## Status

Implemented as a vertical slice for the Sales Analytics table.

Phase 6 moves transaction row pagination and sortable table headers to the backend-backed API contract. The frontend no longer paginates the Sales Analytics transaction rows by slicing already-loaded rows as the source of truth. Apparently browsers are not databases. Shocking revelation, but useful.

## Scope

### Backend

- Add `page`, `pageSize`, `sortBy`, and `sortDirection` to the Sales Analytics query contract.
- Validate page and page size.
- Cap page size at 100 rows.
- Whitelist sort keys.
- Whitelist sort direction.
- Add backend row count for transaction rows.
- Add backend pagination metadata to `SalesAnalyticsDto`.
- Add SQL `LIMIT` and `OFFSET` for transaction rows.
- Add SQL sorting for whitelisted columns only.

### Frontend

- Add controlled pagination support to the shared `DataTable` component.
- Add optional controlled sorting support to the shared `DataTable` component.
- Wire Sales Analytics table pagination to backend query params.
- Wire Sales Analytics sortable headers to backend query params.
- Reset table page to 1 when filters or sorting change.

### Not in this phase

- No schema migration.
- No rate limiter middleware installation.
- No Redis cache.
- No item-level COGS allocation.
- No role-based partial analytics DTO.

## API Query Contract

```txt
GET /api/sales-analytics?page=1&pageSize=10&sortBy=date&sortDirection=desc
```

Supported query params:

```txt
from
to
basis
productId
categoryId
paymentMethod
orderStatus
q
page
pageSize
sortBy
sortDirection
```

## Allowed Sorting

```txt
date
productName
quantity
totalRevenue
grossProfit
margin
paymentStatus
```

## Allowed Sort Direction

```txt
asc
desc
```

## Pagination Response

`SalesAnalyticsDto` now includes:

```ts
pagination: {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
};
```

## Backend Rules

- Backend validates all pagination and sorting params.
- Backend owns row count.
- Backend owns row ordering.
- Frontend does not sort backend rows locally.
- Frontend does not invent total row count.
- Query stays scoped by `restaurantId`.
- Row query still uses existing stored transaction records.
- Page size is capped to avoid unlimited analytics table loads.

## Database Notes

The query uses existing indexed/filterable fields:

- `Order.restaurantId`
- `Order.createdAt`
- `Order.status`
- `Order.paymentMethod`
- `OrderItem.menuItemId`
- `MenuItem.categoryId`

No schema was added for UI decoration.

## Frontend Rules

The table now uses backend-controlled state:

```txt
page -> API query
pageSize -> API query
sortBy -> API query
sortDirection -> API query
```

When filters change, the table returns to page 1.

When sort changes, the table returns to page 1.

The shared `DataTable` still supports old client-side pagination for other screens. Controlled pagination is optional and opt-in.

## Anti-pattern Checklist

```txt
[x] No unlimited Sales Analytics transaction row fetch
[x] No frontend-only sorting for server data
[x] No frontend-invented total row count
[x] No unsafe sortBy SQL interpolation
[x] No unscoped tenant query
[x] No database schema added for UI controls
[x] No fake pagination metadata
[x] No hidden-button security
[x] No money Float introduced
[x] No route-level business logic blob
```

## Manual Test Checklist

### API validation

```txt
GET /api/sales-analytics?page=0 -> 400
GET /api/sales-analytics?pageSize=0 -> 400
GET /api/sales-analytics?pageSize=999 -> 400
GET /api/sales-analytics?sortBy=createdByPassword -> 400
GET /api/sales-analytics?sortDirection=sideways -> 400
```

### API pagination

```txt
GET /api/sales-analytics?page=1&pageSize=10
-> rows.length <= 10
-> pagination.page = 1
-> pagination.pageSize = 10
-> pagination.totalRows >= rows.length
-> pagination.totalPages >= 1
```

### API sorting

```txt
GET /api/sales-analytics?sortBy=date&sortDirection=desc
GET /api/sales-analytics?sortBy=productName&sortDirection=asc
GET /api/sales-analytics?sortBy=quantity&sortDirection=desc
GET /api/sales-analytics?sortBy=totalRevenue&sortDirection=desc
GET /api/sales-analytics?sortBy=grossProfit&sortDirection=desc
GET /api/sales-analytics?sortBy=margin&sortDirection=desc
GET /api/sales-analytics?sortBy=paymentStatus&sortDirection=asc
```

### Frontend

```txt
Open /dashboard/analytics
Rows show page 1 from backend
Click Next
API query uses page=2
Click Previous
API query uses page=1
Click sortable Date header
API query changes sortBy=date and toggles direction
Click Product header
API query changes sortBy=productName
Change product/category/payment/status/date/search filter
Table resets to page 1
```

## Deferred

- Cursor pagination for very large datasets.
- Backend rate limiter installation for analytics view/export.
- Dedicated indexes beyond current schema if slow query analysis shows a need.
- Automated integration tests.
- Item-level COGS allocation.
