# Reports Frontend Integration

## Scope

This document records the Phase 2 frontend integration for shared Financial Reports.

The goal is to replace static financial report data with backend-owned report data while keeping the existing dashboard layout usable.

## Docs Checked

- Frontend rules: frontend is presentation/input only, server state must come from backend APIs, loading/error/empty/refetch states are required.
- Backend rules: backend remains the business decision maker and returns consistent responses.
- Database rules: database stores official order, payment, cashflow, invoice, stock movement, and report source data.
- Anti-patterns: no frontend business logic, no trusted frontend totals, no fake enterprise rows, no unlimited fetch, no hidden UI as security.

## Implemented

### API Client

Created:

```txt
artifacts/pos-system/src/lib/api/financial-reports-api.ts
```

It supports:

```txt
GET /api/financial-reports
GET /api/financial-reports/export
```

The client defines typed report DTOs for period, basis, summary, P&L, trend, best sellers, cash rows, receivables, and source health.

### Dashboard

Updated:

```txt
artifacts/pos-system/src/features/shared/financial-reports/financial-reports-dashboard.tsx
```

Changes:

```txt
removed hardcoded KPI values
removed hardcoded trend rows
removed hardcoded best-seller rows
removed hardcoded P&L rows
removed hardcoded cash-in/cash-out rows
replaced fake source selectors with backend report basis selector
added backend fetch via financialReportsApi.getReport()
added backend export via financialReportsApi.exportReport()
added loading state
added error state
added empty states through DataTable empty messages
added refetch via Refresh button
added source health panel
added source warning display
added CSV export for cash-in/cash-out server rows
added JSON export for full backend report
kept print/PDF action using current loaded server report
```

## Data Pipeline

```txt
Orders + OrderItems -> revenue, order count, AOV, best sellers
StockMovement -> COGS
CashflowEntry -> cash in, cash out, expenses
Invoice -> receivables
Financial Report API -> Financial Reports Dashboard
```

## Frontend Checklist

```txt
✅ No hardcoded report values
✅ Server state from backend API
✅ Loading state
✅ Error state
✅ Empty state
✅ Refresh refetches backend
✅ Period selector changes backend query
✅ Basis selector changes backend query
✅ KPI cards use backend summary
✅ Trend uses backend data
✅ Best sellers use backend data
✅ P&L uses backend data
✅ Cash tables use backend data
✅ Receivables use backend data
✅ Export uses backend-loaded data
✅ Source health warnings shown from backend
```

## Backend/Database Alignment

```txt
✅ Frontend does not calculate final financial totals as truth
✅ Frontend does not choose restaurant/business scope
✅ Frontend does not access database directly
✅ Frontend uses API response as final state
✅ Export calls backend export endpoint for full report payload
✅ Cash CSV export only exports already-loaded backend rows
```

## Anti-Pattern Checklist

```txt
✅ No fake enterprise rows
✅ No frontend-only financial truth
✅ No disabled dummy source controls
✅ No direct DB calls from frontend
✅ No massive unbounded fetch from frontend
✅ No any-based silence for report DTOs
✅ No hidden UI treated as security
✅ No optimistic update for financial source data
```

## Deferred

```txt
- shadcn polish / design-system cleanup
- dedicated backend PDF renderer
- reconciliation drill-down endpoints
- cashflow/order/invoice detail drawer
- automated frontend tests
- print stylesheet polish
```
