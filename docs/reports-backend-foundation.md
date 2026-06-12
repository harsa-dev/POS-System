# Reports Backend Foundation

Phase 1 creates the backend foundation for Shared Financial Reports.

## Checked docs

- `03-frontend.md`
- `04-backend-api.md`
- `05-database-storage.md`
- `appendices/permission-keys.md`
- `appendices/anti-patterns.md`
- `appendices/implementation-rules.md`

## API

### GET `/api/financial-reports`

Query:

```txt
from
to
basis=hybrid|cashflow|orders
```

Returns period, basis, generatedAt, summary, profitLoss, trend, bestSellingProducts, cashIn, cashOut, receivables, and sourceHealth.

### GET `/api/financial-reports/export`

Returns a JSON export payload from the same backend-generated report.

## Pipeline

```txt
Order + OrderItem -> revenue, order count, best sellers
StockMovement -> COGS
CashflowEntry -> cash in, cash out, expenses
Invoice -> receivables
```

## Basis

- `hybrid`: default. Orders for revenue, stock movements for COGS, ledger for cash movement, invoices for receivables.
- `cashflow`: revenue and expenses from ledger.
- `orders`: revenue and COGS from operational records.

## Checklist

- [x] Backend-owned report projection.
- [x] Thin route handlers.
- [x] Service layer composition.
- [x] Repository layer database reads.
- [x] `restaurantId` scoped queries.
- [x] Backend permission checks.
- [x] Query validation.
- [x] Stored integer money values.
- [x] No frontend final totals.
- [x] No schema churn for UI decoration.
- [x] No unbounded detail rows.
- [x] Source health warnings.

## Deferred

- Frontend API client.
- Replacing hardcoded financial dashboard data.
- PDF/CSV rendering.
- Drill-down reconciliation endpoints.
- Automated tests.
