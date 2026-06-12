# Cashflow Enterprise Dashboard Implementation

This document records the Phase 4-9 implementation slice for the shared cashflow dashboard.

## Implementation constraints

- Frontend is presentation and input only.
- Backend is the business decision maker.
- Database ledger is the source of truth.
- Money is stored as integer values.
- Tenant scope is derived by backend, never by client input.
- Route handlers stay thin.
- Service layer owns permission, validation, mutation rules, and audit behavior.
- Repository layer owns data access.
- No hardcoded finance rows.
- No local-only sync state.
- No duplicate source sync.

## Implemented phases

### Phase 4: Frontend API client

Added `artifacts/pos-system/src/lib/api/cashflow-api.ts`.

The client supports dashboard read, entries list, manual entry create, order source sync, shift source sync, and void action.

### Phase 5: Dashboard

`CashflowDashboard` now reads from backend ledger APIs.

Implemented:

1. Backend summary.
2. Backend ledger table.
3. Backend filters.
4. Pagination metadata.
5. Refresh action.
6. Manual entry modal.
7. Source sync modal.
8. Void action.
9. Export current loaded rows.
10. Analysis modal from backend data.
11. Loading/error/empty states.
12. No hardcoded rows.

### Phase 6: Manual entry

Manual entries use backend mutation and backend validation. Frontend refetches after backend confirmation.

### Phase 7: Shift integration

Cashier shift reports now load real shifts from `GET /api/shifts`.

Shift sync status is derived from ledger source records. The previous local-only sync state was removed.

### Phase 8: Payment integration

Payment transaction order lookup now uses the correct restaurant scope. Settlement callback validates amount and creates an idempotent ledger record.

### Phase 9: Manual E2E

Minimum testing path:

1. Run backend typecheck and build.
2. Run frontend build.
3. Login as OWNER or MANAGER.
4. Open Cashflow.
5. Create manual entry.
6. Confirm table and summary update.
7. Void entry.
8. Sync an eligible order source.
9. Repeat the same sync and confirm no duplicate ledger row.
10. Open Cashier Shift Reports.
11. Sync an eligible closed shift.
12. Export cashflow rows.

## Checklists

### Frontend

- [x] Server state from API.
- [x] No hardcoded cashflow rows.
- [x] Loading state.
- [x] Error state.
- [x] Empty state.
- [x] Manual entry mutation.
- [x] Source sync mutation.
- [x] Void mutation.
- [x] Export real rows.
- [x] Pagination UI.
- [x] Analysis uses backend data.
- [x] Shift report sync uses backend.

### Backend

- [x] Dashboard aggregate endpoint.
- [x] Entries endpoint.
- [x] Manual entry endpoint.
- [x] Order source sync endpoint.
- [x] Shift source sync endpoint.
- [x] Void endpoint.
- [x] Payment scope bug fixed.
- [x] Callback amount validation.
- [x] Idempotent ledger write.
- [x] Shift API exposes ledger sync state.

### Database and storage

- [x] Ledger table is the source of truth.
- [x] Integer amount.
- [x] Restaurant scope.
- [x] Optional business bridge scope.
- [x] Source type.
- [x] Source id.
- [x] Idempotency key.
- [x] Void uses status, not delete.
- [x] Dashboard derives from ledger.

### Anti-patterns avoided

- [x] No fake enterprise buttons.
- [x] No frontend final money truth.
- [x] No local-only shift sync.
- [x] No duplicate source sync.
- [x] No unscoped order lookup.
- [x] No destructive ledger delete.
- [x] No direct database access from frontend.

## Next hardening

1. Add bulk export endpoint for large datasets.
2. Add system actor strategy for callback audit logs.
3. Add order picker UI instead of manual order ID input.
4. Add automated API tests for entry create, sync, duplicate sync, and void.
