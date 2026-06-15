# Cashier Shift Reports Final Audit

## 1. Scope

This audit covers the shared Cashier Shift Reports workspace after the backend guard, backend report filters, backend export, sync reconciliation, persistent sync attempt logging, retry history, and CSV/JSON export phases.

The goal of this workspace is to provide management-only visibility into cashier shift performance, cash variance, and cashflow sync health without breaking operational cashier shift open/close flows.

## 2. Backend route order

The cashier shift report routes depend on route order because some reporting endpoints intentionally sit in front of legacy cashflow and shift routes.

Current expected order in `artifacts/api-server/src/routes/index.ts`:

```ts
router.use(cashierShiftReportsGuardRouter);
router.use(cashierShiftReportsRouter);
router.use(cashierShiftReportsReconciliationRouter);
router.use(cashierShiftSyncAttemptsRouter);
router.use(cashflowRouter);
router.use(shiftsRouter);
```

Why this matters:

- `cashierShiftReportsGuardRouter` must run before report, reconciliation, attempt history, cashflow sync, and shift list routes.
- `cashierShiftSyncAttemptsRouter` must run before `cashflowRouter` so `POST /api/cashflow/sync/shifts/:shiftId` is wrapped with a persistent attempt log.
- `shiftsRouter` must remain after the report guard so `GET /api/shifts` is protected as report access, while operational routes such as open/current/close still continue through the normal shift router.

## 3. Capability policy

Endpoint:

```txt
GET /api/cashier-shift-reports-capabilities
```

Policy:

```txt
canView: management only
canExport: management only
canSyncToCashflow: management only
custom-business: blocked as planned mode
```

Management roles are resolved by backend constants. The frontend workspace checks the same capability response before rendering the dashboard.

## 4. Guarded backend surfaces

The guard protects:

```txt
GET  /api/cashier-shift-reports
GET  /api/cashier-shift-reports/export
GET  /api/cashier-shift-reports/reconciliation
GET  /api/cashier-shift-reports/sync-attempts
GET  /api/cashier-shift-reports/sync-attempts/:shiftId
GET  /api/cashier-shift-reports/sync-attempts/:shiftId/export
GET  /api/shifts
POST /api/cashflow/sync/shifts/:shiftId
```

The important separation is that report/list/sync/export surfaces are management-only, while the rest of the shift operational flow remains handled by the existing shift module.

## 5. Backend report and export

Primary report endpoint:

```txt
GET /api/cashier-shift-reports
```

Supported filters:

```txt
status
cashier
dateRange
from
to
syncStatus
limit
```

Export endpoint:

```txt
GET /api/cashier-shift-reports/export?format=csv
GET /api/cashier-shift-reports/export?format=json
```

Export is backend-scoped and uses the same report query model as the dashboard. This replaced the earlier client-side export from current UI rows.

## 6. Frontend report flow

Workspace:

```tsx
<CashierShiftReportsWorkspace />
```

Dashboard:

```tsx
<CashierShiftReportsDashboard />
```

Dashboard data flow:

```txt
filters -> buildReportQuery() -> shiftsApi.listReports() -> mapped backend rows -> ShiftKpis + ShiftList
```

Current backend-backed filters:

```txt
status
cashier
dateRange
```

Current local fallback:

```txt
Business Scope / warehouse
```

The business scope filter remains local because the report endpoint is already business-scoped but does not yet expose a separate business-scope dimension beyond the current business.

## 7. Sync reconciliation

Endpoint:

```txt
GET /api/cashier-shift-reports/reconciliation
```

Reconciliation states:

```txt
SYNCED
READY_TO_SYNC
NEEDS_REVIEW
BLOCKED_OPEN
SYNC_FAILED
```

State meaning:

- `SYNCED`: a matching cashflow entry already exists.
- `READY_TO_SYNC`: closed shift, no cashflow entry, no variance risk, no failed latest attempt.
- `NEEDS_REVIEW`: closed shift, not synced, cash variance exists.
- `BLOCKED_OPEN`: shift is still open.
- `SYNC_FAILED`: latest persistent sync attempt failed.

The reconciliation panel can sync or retry eligible rows and then refreshes both the panel and the main table/KPI.

## 8. Persistent sync attempt log

Runtime table:

```txt
ShiftCashflowSyncAttempt
```

Attempt statuses:

```txt
RUNNING
SUCCESS
FAILED
```

Wrapped route:

```txt
POST /api/cashflow/sync/shifts/:shiftId
```

Wrapper flow:

```txt
create RUNNING attempt
call syncShiftCloseToCashflow()
mark SUCCESS with cashflowEntryId
or mark FAILED with errorCode/errorMessage
```

This makes sync failures durable across refreshes and allows reconciliation to show `SYNC_FAILED` using the latest attempt.

## 9. Sync attempt history and export

History endpoint:

```txt
GET /api/cashier-shift-reports/sync-attempts/:shiftId
```

Export endpoints:

```txt
GET /api/cashier-shift-reports/sync-attempts/:shiftId/export?format=csv
GET /api/cashier-shift-reports/sync-attempts/:shiftId/export?format=json
```

The frontend reconciliation panel exposes a `History` action per row and renders the attempt history panel with summary cards, full attempt rows, and CSV/JSON export.

## 10. Frontend components

Main workspace and panels:

```txt
cashier-shift-reports-workspace.tsx
cashier-shift-reports-dashboard.tsx
cashier-shift-sync-reconciliation-panel.tsx
cashier-shift-sync-attempt-history-panel.tsx
```

Shared API client:

```txt
artifacts/pos-system/src/lib/api/shifts-api.ts
```

Backend routes/helpers:

```txt
cashier-shift-reports-guard.ts
cashier-shift-reports.ts
cashier-shift-reports-reconciliation.ts
cashier-shift-sync-attempts.ts
lib/shift-sync-attempt-log.ts
```

## 11. Validation checklist

Run:

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual smoke test:

1. Login as OWNER or MANAGER.
2. Open Cashier Shift Reports.
3. Confirm capability guard allows access.
4. Change status/cashier/date range filters.
5. Confirm KPI and table reload from backend report rows.
6. Export CSV and confirm row count/header.
7. Open reconciliation panel.
8. Confirm states: synced, ready, review, open, failed.
9. Retry sync on a ready or failed row.
10. Confirm dashboard KPI/table refresh after sync.
11. Open attempt history for a shift.
12. Export attempt history CSV and JSON.
13. Login as non-management role and confirm report/export/reconciliation/sync are blocked.
14. Test custom-business mode and confirm planned guard blocks report access.

## 12. Known cautions

- `ShiftCashflowSyncAttempt` is created at runtime with raw SQL, not represented as a Prisma model.
- Persistent failed attempts depend on the wrapper route being mounted before the legacy cashflow sync route.
- `Business Scope` is still a local UI fallback, not a backend report filter dimension.
- Dashboard still has a local `failedSyncIds` fallback for batch sync message display, but persistent failure state now comes from backend reconciliation latest attempts.
- Attempt history export should be smoke-tested with multiple retries for the same shift.
- The report endpoint is management-only by policy. Do not relax view access until export/sync buttons are separated from read-only UI.

## 13. Completion status

Cashier Shift Reports is now considered phase-complete for the shared dashboard hardening pass:

```txt
capability guard
backend report filtering
backend export
backend-backed KPI/table
sync reconciliation
persistent sync attempt log
sync failed state
attempt history drawer
attempt history export
final audit doc
```
