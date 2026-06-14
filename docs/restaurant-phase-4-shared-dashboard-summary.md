# Restaurant Phase 4 - Shared dashboard backend summary

Status: implemented
Scope: Restaurant business mode only

## Goal

Expose Restaurant-scoped backend summaries for shared dashboards without calling legacy F&B dashboard components directly.

Phase 4 keeps the backend read-only. It does not create order, refund, table, menu, or inventory mutations.

## Implemented endpoint

```text
GET /restaurant/shared-dashboard/:dashboardId
```

This route is mounted with the API router, so the runtime path is usually:

```text
GET /api/restaurant/shared-dashboard/:dashboardId
```

## Guard behavior

All shared dashboard requests use the same Restaurant route guard as the read-only backend route foundation:

- User must pass `RESTAURANT_READ_ROLES`.
- User must have a business context.
- Business mode must be `restaurant`.
- Non-restaurant users get `businessModeMismatch`.
- Unknown dashboard IDs return 404.

## Supported dashboard IDs

```text
overview
sales
customers
inventory
cashflow
financial-reports
invoice-generator
shift-reports
team-management
employee-performance
approvals
audit-controls
roster-overview
employee-attendance
employee-contracts
payroll
```

## Data sources

The shared dashboard service summary is built from the Restaurant repository foundation:

- `getDashboardSummary`
- `listMenuItems`
- `listTables`
- `listActiveOrders`
- `listKitchenQueue`
- `listServingQueue`

The Prisma repository currently reads from existing core Restaurant-era tables:

- `MenuItem`
- `Category`
- `Recipe`
- `InventoryItem`
- `DiningTable`
- `Order`
- `OrderItem`
- `Payment`

## Dashboard behavior by area

### Overview / approvals / audit controls / roster overview

Returns general Restaurant operations context:

- active orders
- today revenue
- kitchen queue
- order/table/menu rows

### Sales / cashflow / financial reports

Returns financial signals from completed orders and active operational order flow:

- today revenue
- completed orders today
- average order value
- active order rows

### Inventory

Returns menu and recipe inventory context:

- menu item count
- active menu item count
- low-stock item count
- recipe ingredient risk rows

### Invoice generator

Returns receipt/payment document context:

- pending payment count
- active order count
- POS receipt mode

### Shift reports / team management

Returns operational staffing pressure context:

- kitchen queue
- serving queue
- occupied tables

### Heavy HR surfaces

These are intentionally served as skipped/planned until Restaurant staff/payroll scope becomes active:

- employee attendance
- employee contracts
- employee performance
- payroll

## Compatibility boundary

Legacy F&B/shared dashboards remain mounted. Phase 4 only adds Restaurant-scoped backend context for future frontend bridge wiring.

Do not delete legacy F&B dashboard imports yet. Frontend bridge replacement belongs in Phase 6.

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
```

Manual API checks after server startup:

```text
GET /api/restaurant/shared-dashboard/overview
GET /api/restaurant/shared-dashboard/sales
GET /api/restaurant/shared-dashboard/inventory
GET /api/restaurant/shared-dashboard/cashflow
```
