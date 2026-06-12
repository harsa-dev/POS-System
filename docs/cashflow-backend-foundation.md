# Cashflow Backend Foundation

This document records the Phase 1-3 cashflow backend foundation.

## Docs checked

- `docs/04-backend-api.md`
- `docs/05-database-storage.md`
- `docs/06-auth-permissions.md`
- `docs/09-security.md`
- `docs/12-error-tracking-logs.md`
- `docs/appendices/api-response-format.md`
- `docs/appendices/error-codes.md`
- `docs/appendices/permission-keys.md`
- `docs/appendices/anti-patterns.md`
- `docs/appendices/implementation-rules.md`

## Scope

Implemented backend and storage foundation for the shared cashflow dashboard.

This foundation covers:

1. Database ledger table setup script.
2. Cashflow permission keys.
3. Cashflow error codes.
4. Service layer.
5. Repository layer.
6. Validation helpers.
7. DTO helpers.
8. Thin API routes.
9. Route mounting.
10. Audit logs for create/sync/void operations.

## Database ledger

The cashflow ledger is stored in `CashflowEntry`.

The setup script is:

```txt
artifacts/api-server/scripts/setup-cashflow-ledger.ts
```

It creates:

- `CashflowEntryType`
- `CashflowEntryStatus`
- `CashflowAccount`
- `CashflowSourceType`
- `CashflowEntry`
- indexes for restaurant scope, dates, type, status, account, source, and actor
- unique idempotency guard per restaurant

The ledger uses:

- `restaurantId` as required MVP ownership scope
- optional `businessId` as bridge scope
- integer `amount`
- `sourceType` and `sourceId`
- `idempotencyKey`
- `occurredAt`, `postedAt`, and `voidedAt`
- optional JSON metadata snapshot

## API contract

Routes:

```txt
GET /api/cashflow-dashboard
GET /api/cashflow-entries
POST /api/cashflow-entries
POST /api/cashflow/sync/orders/:orderId
POST /api/cashflow/sync/shifts/:shiftId
PATCH /api/cashflow-entries/:id/void
```

Query parameters for list/dashboard:

```txt
from
to
account
type
status
sourceType
search
page
limit
```

## Permissions

Cashflow permission keys:

```txt
shared.cashflow.view
shared.cashflow.create
shared.cashflow.sync
shared.cashflow.void
shared.cashflow.export
```

Role mapping:

- OWNER: full cashflow access.
- MANAGER: full cashflow access.
- CASHIER: cashflow view and sync only.
- KITCHEN: no cashflow access.
- SERVER: no cashflow access.

## Error codes

Cashflow error codes added in code:

```txt
CASHFLOW_ENTRY_NOT_FOUND
DUPLICATE_CASHFLOW_ENTRY
INVALID_CASHFLOW_AMOUNT
INVALID_CASHFLOW_STATUS
CASHFLOW_SOURCE_NOT_READY
```

These codes follow the uppercase snake-case rule and are safe for frontend handling.

## Backend checklist

1. Backend remains the business decision maker.
2. Database remains the source of truth.
3. Route handlers are thin.
4. Service layer owns permission, transaction, audit, and business rules.
5. Repository layer owns SQL access.
6. API response helpers are preserved.
7. Cashflow list uses pagination.
8. Cashflow queries are restaurant scoped.
9. Cashflow sync uses idempotency keys.
10. Important mutations create audit logs.
11. Manual entry validates amount and enums.
12. Void does not delete historical ledger records.

## Database/storage checklist

1. Cashflow entries have ownership scope.
2. Current scope uses `restaurantId`.
3. Future bridge scope uses optional `businessId`.
4. Money uses integer amount.
5. Ledger entries store source snapshots.
6. Indexes support date/type/status/source/account queries.
7. Idempotency prevents duplicate source sync.
8. Historical entries are voided, not deleted.
9. Frontend state is not persisted directly.
10. Setup script is idempotent.

## Security checklist

1. Backend derives user from session.
2. Backend derives restaurant/business scope.
3. Backend does not trust `restaurantId` or `businessId` from body.
4. Protected routes require auth.
5. Protected actions check permissions.
6. Tenant-hidden rows return not found.
7. Error messages avoid stack traces and secrets.
8. Audit logs are created for critical mutations.

## Anti-pattern checklist

1. No frontend-only cashflow truth.
2. No fake enterprise dashboard rows.
3. No unscoped ledger query.
4. No direct DB access from frontend.
5. No money Float.
6. No duplicate source sync without idempotency.
7. No giant route handler.
8. No deleting ledger history for void.
9. No hidden-button security.
10. No raw stack traces in API response.

## Notes

The Prisma schema update was blocked by the GitHub connector safety checker during this implementation. To avoid pretending generated Prisma models exist, this phase uses an idempotent SQL setup script and typed raw SQL repository methods. A later cleanup can mirror the same ledger model into `schema.prisma` once the connector allows the schema update safely.
