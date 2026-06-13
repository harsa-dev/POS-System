# Sales Analytics Phase 8: Role-Based Views

## Status

Phase 8 adds backend-enforced role-scoped analytics views.

The goal is to let operational roles view safe sales activity while keeping profit, COGS, margin, net profit, and export access restricted to profit analytics roles.

## Access model

| Role | Operational analytics | Profit metrics | Export |
| --- | --- | --- | --- |
| OWNER | Yes | Yes | Yes |
| MANAGER | Yes | Yes | Yes |
| CASHIER | Yes | No | No |
| KITCHEN | No | No | No |
| SERVER | No | No | No |

## Backend permissions

Backend permission keys:

- `shared.analytics.view`
- `shared.analytics.operational-view`
- `shared.analytics.profit-view`
- `shared.analytics.export`

Rules:

- `requireSalesAnalyticsView()` requires `shared.analytics.operational-view`.
- `requireSalesAnalyticsExport()` requires `shared.analytics.export`.
- Profit visibility is exposed through `report.access.canViewProfit`.
- Export capability is exposed through `report.access.canExport`.

## API contract

`GET /api/sales-analytics` now returns:

```ts
access: {
  canViewOperational: boolean;
  canViewProfit: boolean;
  canExport: boolean;
}
```

For operational-only users, backend masks profit fields:

```ts
summary.cogs = null
summary.grossProfit = null
summary.margin = null
summary.netProfit = null

row.cogs = null
row.grossProfit = null
row.margin = null
```

Frontend must not infer profit access from local role state. It must use `report.access`.

## Frontend behavior

- Analytics menu visibility uses `analytics.operational-view`.
- CASHIER can enter Sales Analytics.
- Profit cards are hidden for operational-only users.
- Profit columns are hidden for operational-only users.
- Profit sort keys are not exposed for operational-only users.
- Export button is disabled unless `report.access.canExport` is true.
- Frontend does not calculate or restore hidden profit metrics.

## Database rules

No database migration is included in this phase.

The backend still reads existing source-of-truth records:

- Orders
- Order items
- Payments
- Stock movements
- Menu items
- Categories

Profit masking happens at DTO/service level after backend calculations, before response leaves the API.

## Anti-patterns avoided

- No frontend-only role hiding.
- No trusting localStorage role for sensitive data.
- No exposing profit fields to operational-only users.
- No fake zero profit values without access metadata.
- No separate unscoped analytics endpoint.
- No broad export permission for operational-only users.

## Manual test checklist

### OWNER

- Can open Sales Analytics.
- Can see gross revenue, total revenue, margin, net profit, quantity.
- Can see COGS, gross profit, margin columns.
- Can export CSV.

### MANAGER

- Same as OWNER.

### CASHIER

- Can open Sales Analytics.
- Can see operational metrics such as revenue, transactions, AOV, quantity.
- Cannot see COGS, gross profit, margin, net profit.
- Cannot export CSV.
- API response has `access.canViewProfit = false`.
- API response masks profit fields as `null`.

### KITCHEN / SERVER

- Cannot access shared Sales Analytics endpoint.
- API returns forbidden.

## Test commands

```powershell
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/pos-system run build
```

## Deferred

- Dedicated operational analytics DTO.
- Dedicated audit entry for restricted attempts.
- Automated permission integration tests.
- UI copy polish for role-restricted empty states.
- Role-based export variants for safe operational exports.
