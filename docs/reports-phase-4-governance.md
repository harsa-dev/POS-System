# Reports Phase 4 Governance

## Scope

Phase 4 hardens financial report governance after the backend report, dashboard, export, and reconciliation pipeline were wired.

The focus is export auditability. Financial report export is treated as a sensitive action because it exposes business financial summaries outside the application UI.

## Docs Checked

- `03-frontend.md`
- `04-backend-api.md`
- `05-database-storage.md`
- `appendices/anti-patterns.md`
- `appendices/implementation-rules.md`

## Implemented

- Added a financial report audit helper in the backend report service module.
- Added audit logging for JSON and CSV financial report export.
- The audit entry uses existing `AuditLog` storage and existing `AuditAction.CREATE`.
- No schema changes were introduced.
- Export now returns `auditLogged: true` only after the audit log write succeeds.

## Audit Event

Entity type:

```txt
FinancialReportExport
```

Entity id format:

```txt
EXPORT:{from}:{to}:{basis}:{format}
```

Recorded metadata:

```txt
query.from
query.to
query.basis
format
filename
contentType
```

## Rules Kept

- Backend remains the source of truth.
- Frontend does not write audit logs.
- Export permission is still enforced by backend.
- Business scope is enforced before export.
- AuditLog is written with restaurantId and userId.
- No new permission key was introduced.
- No new schema was introduced.
- No business logic was moved to React.

## Deferred

- Frontend display for export audit metadata.
- Dedicated audit log viewer/filter for financial report exports.
- Automated integration test for export audit logging.
- Server-rendered PDF export.
