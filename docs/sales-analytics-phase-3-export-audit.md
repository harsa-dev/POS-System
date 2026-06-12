# Sales Analytics Phase 3 - Export + Audit

## Status

Phase 3 moves Sales Analytics export away from the frontend table utility and into the backend analytics pipeline.

This phase is required because analytics export is private business data. The frontend may trigger the export and download the returned file, but it must not decide the final export content, permission, tenant scope, or audit trail.

## Goals

- Export Sales Analytics from backend data.
- Support JSON and CSV export formats.
- Enforce backend export permission.
- Scope every export to the current restaurant.
- Audit every successful export.
- Keep private analytics responses uncached.
- Remove frontend-only Excel export as the source of exported data.

## Backend contract

### Endpoint

```txt
GET /api/sales-analytics/export?from=&to=&basis=paid&q=&productId=&limit=&format=json
GET /api/sales-analytics/export?from=&to=&basis=paid&q=&productId=&limit=&format=csv
```

### Supported formats

```txt
json
csv
```

Invalid format must return a validation error.

### Response shape

```ts
type SalesAnalyticsExportFileDto = {
  exportedAt: string;
  format: "json" | "csv";
  filename: string;
  contentType: string;
  auditLogged: boolean;
  report?: SalesAnalyticsDto;
  content?: string;
};
```

### JSON export

JSON export returns the full backend `SalesAnalyticsDto` in `report`.

### CSV export

CSV export returns downloadable CSV content in `content`.

CSV sections:

```txt
Report Metadata
Summary
Sales Rows
Daily Trend
Busy Hours
Best Selling Products
Source Health
Source Health Warnings
```

## Permission rules

Full sales analytics export requires:

```txt
shared.analytics.export
```

Expected role behavior:

```txt
OWNER   -> allowed
MANAGER -> allowed
CASHIER -> forbidden
KITCHEN -> forbidden
SERVER  -> forbidden
```

The frontend may disable or hide buttons for UX, but backend permission remains the real enforcement point.

## Audit rules

Every successful export writes an audit log.

Expected audit fields:

```txt
entityType: SalesAnalyticsExport
action: CREATE
restaurantId: current restaurant
userId: current user
changes.query: exported query range/filter/basis/limit
changes.format: json or csv
changes.filename: generated filename
changes.contentType: response content type
```

Export should fail if audit logging fails. A private export without audit is not acceptable for this project.

## Caching rules

Sales analytics export is private tenant data.

Backend route should set:

```txt
Cache-Control: no-store
```

Do not use public CDN caching for analytics export.

## Frontend behavior

The dashboard export button calls:

```ts
salesAnalyticsApi.exportReport({
  ...query,
  format: "csv",
});
```

Then it downloads the returned backend `content` using the backend `filename` and `contentType`.

The frontend must not export from hardcoded rows or recalculate final analytics numbers.

## Anti-pattern checklist

- [x] No hardcoded export rows.
- [x] No frontend-only export source of truth.
- [x] No client-side permission enforcement as the only guard.
- [x] No tenant id from request query/body.
- [x] No public cached export.
- [x] No export without audit.
- [x] No unsupported export format.
- [x] No file persistence without storage permission model.
- [x] No database schema change for this MVP phase.

## Manual test checklist

### Backend success

```txt
OWNER   GET /api/sales-analytics/export?format=json -> 200
OWNER   GET /api/sales-analytics/export?format=csv  -> 200
MANAGER GET /api/sales-analytics/export?format=csv  -> 200
```

### Backend forbidden

```txt
CASHIER GET /api/sales-analytics/export?format=json -> 403
KITCHEN GET /api/sales-analytics/export?format=csv  -> 403
SERVER  GET /api/sales-analytics/export?format=csv  -> 403
```

### Validation

```txt
GET /api/sales-analytics/export?format=pdf -> 400
GET /api/sales-analytics/export?limit=999 -> 400
GET /api/sales-analytics/export?from=bad-date -> 400
```

### Audit log

After a successful export, verify:

```txt
AuditLog.entityType = SalesAnalyticsExport
AuditLog.action = CREATE
AuditLog.restaurantId = current restaurant
AuditLog.userId = exporter user
AuditLog.changes.format = csv/json
AuditLog.changes.filename exists
AuditLog.changes.query exists
```

### Frontend

```txt
Open /dashboard/analytics
Click Export CSV
CSV downloads with backend filename
Disable backend or force 403
Export error appears
Refresh still works
Dashboard table still uses backend report rows
```

## Deferred work

- Persistent export storage with signed URLs.
- PDF export.
- Dedicated export rate limiter.
- Automated integration tests.
- Server-side table pagination.
- Product-level COGS allocation.
- Role-specific limited analytics export for cashier.
