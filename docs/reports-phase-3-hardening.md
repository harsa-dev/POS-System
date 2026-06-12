# Reports Phase 3 Hardening

## Scope

Phase 3 improves the report pipeline after the backend projection and frontend API wiring phases.

This phase focuses on:

- backend export hardening
- frontend export API support
- source health visibility
- safe follow-up work for drilldown rows

## Docs checked

- `03-frontend.md`
- `04-backend-api.md`
- `05-database-storage.md`
- `appendices/anti-patterns.md`
- `appendices/implementation-rules.md`

## Implemented

### Backend CSV export builder

A dedicated backend export builder was added:

```txt
artifacts/api-server/src/services/financial-reports/report-export.ts
```

It supports:

```txt
json
csv
```

The builder uses the existing backend report projection and does not calculate report totals in the frontend.

### Export route format support

The existing route now reads `format=csv` or defaults to `json`:

```txt
GET /api/financial-reports/export?format=json
GET /api/financial-reports/export?format=csv
```

The response still uses the standard API envelope.

### Frontend export helper

A frontend export API helper was added:

```txt
artifacts/pos-system/src/lib/api/financial-reports-export-api.ts
```

It keeps export fetch logic outside the React component.

## Deferred

The row-level reconciliation repository and dashboard replacement were attempted, but the GitHub connector safety checker blocked the larger SQL/component payloads.

Deferred items:

```txt
GET /api/financial-reports/reconciliation
row-level unsynced order drilldown
row-level missing COGS snapshot drilldown
row-level pending/voided ledger drilldown
dashboard export buttons wired to the new export helper
```

These are safe to continue locally or in smaller follow-up commits.

## Checklist

### Backend

```txt
DONE: backend-owned export builder
DONE: json export kept
DONE: csv export added
DONE: route remains thin
DONE: permission still enforced through service/export builder
DONE: standard API response preserved
```

### Frontend

```txt
DONE: export API helper added
DONE: no direct database access
DONE: no frontend final report totals
PENDING: dashboard buttons wired to new helper
PENDING: reconciliation drilldown UI
```

### Database

```txt
DONE: no schema churn for UI decoration
DONE: export uses stored backend report values
DONE: no Float money introduced
```

### Anti-patterns

```txt
AVOIDED: fake export button without backend route
AVOIDED: frontend-only report truth
AVOIDED: inconsistent API response shape
AVOIDED: schema change just for UI
PENDING: full row-level reconciliation drilldown
```

## Local follow-up recommendation

Next safe local edits:

1. Import `financialReportExportApi` in the dashboard.
2. Add `Export CSV` button next to `Export JSON`.
3. Call `financialReportExportApi.exportReport({ ...query, format: "csv" })`.
4. Download `response.data.content` using `Blob`.
5. Add a small reconciliation detail endpoint in a separate follow-up commit.
