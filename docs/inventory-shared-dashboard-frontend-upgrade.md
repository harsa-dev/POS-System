# Shared Inventory Dashboard Frontend Upgrade

This document records the shared inventory dashboard frontend upgrade.

## Docs checked

- `docs/03-frontend.md`
- `docs/04-backend-api.md`
- `docs/05-database-storage.md`
- `docs/inventory-backend-workflow.md`
- `docs/inventory-shared-mode-framework.md`
- `docs/appendices/api-response-format.md`
- `docs/appendices/anti-patterns.md`
- `docs/appendices/implementation-rules.md`

## Scope

The shared inventory dashboard must use backend API state and must not keep fake disabled features.

## Implemented workflows

1. API-backed inventory dashboard.
2. Inventory capability policy display.
3. Create inventory item workflow.
4. Create stock movement workflow.
5. CSV inventory import using the existing backend create-item endpoint.
6. Inventory CSV export.
7. Stock analysis using loaded backend items and movement history.
8. Manual synchronization/refetch workflow.
9. Loss report from backend movement history.
10. Record loss movement using the backend stock movement endpoint.

## Frontend checklist

1. Server state comes from backend APIs.
2. Local UI state is kept local.
3. Forms validate required fields for UX.
4. Backend still validates correctness.
5. Loading state is visible.
6. Error state is visible.
7. Empty table state is visible.
8. Refetch/synchronization is user-triggerable.
9. Search/filter/sort operate on loaded inventory data.
10. Stock mutation is not optimistic.
11. Buttons no longer represent fake disabled features.
12. Planned modes remain policy-driven and mode-aware.

## Backend/API checklist

1. Frontend calls backend APIs only.
2. Stock mutation uses `POST /api/inventory`.
3. Item creation uses `POST /api/inventory-items`.
4. Dashboard state uses `GET /api/inventory-dashboard`.
5. Capabilities use `GET /api/inventory-capabilities`.
6. Movement history uses `GET /api/inventory?limit=100`.
7. Backend owns business scope.
8. Backend owns stock mutation logic.
9. Backend owns audit behavior.
10. API envelope format is preserved.

## Database/storage checklist

1. Inventory items remain official database state.
2. Stock movements remain official history.
3. Dashboard values are derived from backend data.
4. Frontend does not persist stock directly.
5. Import creates real database rows through backend API.
6. Loss report reads backend movement history.
7. Loss recording creates backend stock movement rows.
8. Money values use integer cost fields from backend DTOs.

## Anti-pattern checklist

1. No hardcoded inventory rows.
2. No fake disabled enterprise buttons.
3. No frontend-only stock truth.
4. No hidden button treated as security.
5. No direct database access from frontend.
6. No direct stock mutation from frontend state.
7. No production-looking future mode without policy context.
8. No blank error-only console state.
9. No unlimited movement fetch; dashboard requests a bounded movement history.
10. No `any` added for the dashboard workflows.

## Notes

CSV import currently calls the existing create item endpoint row-by-row. This preserves backend validation and business scope. A future backend bulk import endpoint may replace it when import transactions, duplicate handling, and per-row error reporting are designed on the backend.
