# Cashier Shift Reports Backend Filtering

## Scope

Cashier Shift Reports now uses the backend report endpoint for the main dashboard rows, KPI input, and CSV export.

This phase moves the dashboard away from loading all raw shifts through `GET /api/shifts` and filtering most report data in the browser.

## Backend endpoint

The dashboard uses:

```txt
GET /api/cashier-shift-reports
```

Supported report filters:

```txt
status
cashier
dateRange
from
to
syncStatus
limit
```

CSV/JSON export uses:

```txt
GET /api/cashier-shift-reports/export?format=csv
GET /api/cashier-shift-reports/export?format=json
```

Both report and export endpoints are guarded by the Cashier Shift Reports capability guard.

## Frontend behavior

The dashboard now calls:

```ts
shiftsApi.listReports(buildReportQuery(filters))
```

The returned backend rows are mapped to the existing `CashierShift` UI model and are used by:

```txt
ShiftKpis
ShiftList
ShiftDetailDrawer
Sync To Cashflow eligibility
```

The Export button calls:

```ts
shiftsApi.downloadReportsCsv(buildReportQuery(filters))
```

## Local fallback filter

`Business Scope` remains a local-only filter for now. The backend report endpoint is already business-scoped, but it does not yet expose a dedicated business-scope/warehouse filter.

This is acceptable for the current shared dashboard because report rows are already scoped to the active business context.

## Known cautions

1. Cashier options are accumulated from loaded report rows so users can still switch back after filtering.
2. Custom date range support depends on future UI supplying explicit `from` and `to` values.
3. Sync failures are still tracked client-side with `failedSyncIds` for immediate UI feedback.
4. Build and smoke tests are still required locally.

## Validation checklist

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual checks:

1. Open Cashier Shift Reports as OWNER/MANAGER.
2. Verify the dashboard loads through `/api/cashier-shift-reports`.
3. Change status filter and confirm table/KPI reload from backend.
4. Change cashier filter and confirm table/KPI reload from backend.
5. Change date range and confirm table/KPI reload from backend.
6. Export CSV and confirm row count follows the active backend filters.
7. Sync a completed unsynced shift to Cashflow and confirm rows refresh.
8. Confirm non-management role is blocked by backend guard.
