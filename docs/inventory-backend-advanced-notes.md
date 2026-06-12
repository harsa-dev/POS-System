# Inventory Backend Advanced Notes

This note records the backend-only inventory hardening pass.

## Docs checked

- `docs/04-backend-api.md`
- `docs/05-database-storage.md`
- `docs/06-auth-permissions.md`
- `docs/backend-structure.md`
- `docs/appendices/implementation-rules.md`

## Scope

Backend only. Frontend dashboard wiring is still the next phase.

## Implemented structure

```txt
services/inventory/
├── inventory.constants.ts
├── inventory.dto.ts
├── inventory.permissions.ts
├── inventory.service.ts
├── inventory.types.ts
├── inventory.validation.ts
└── index.ts
```

## Rules preserved

1. Inventory routes stay thin.
2. Inventory service owns workflow orchestration.
3. Validation helpers own payload parsing.
4. DTO helpers own dashboard response mapping.
5. Permission helpers use `shared.inventory.view` and `shared.inventory.adjust`.
6. Legacy inventory tables still use `businessContext.restaurantId`.
7. Item creation records opening stock through movement workflow.
8. Item updates convert stock edits into adjustment workflow.
9. Item deletion is rejected when history or recipe usage exists.
10. Stock movement writes are transactional and audited.

## Frontend contract reminder

The shared Inventory dashboard should consume `GET /api/inventory-dashboard` first, then use `POST /api/inventory-items` and `POST /api/inventory` for real workflows.
