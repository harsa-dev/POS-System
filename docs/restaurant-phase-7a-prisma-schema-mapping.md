# Restaurant Phase 7A - Prisma Schema Model Mapping

Status: implemented
Scope: Restaurant business mode only

## Goal

Phase 7A defines the canonical Prisma model mapping used by the scoped Restaurant service layer.

Unlike Retail, Restaurant already has mature Prisma models from the older F&B flow. This phase does not create new tables. It documents and verifies the canonical mapping so future Restaurant work does not drift back into legacy F&B assumptions.

## Implemented files

- `artifacts/api-server/src/services/restaurant/restaurant.prisma-model-map.ts`
- `artifacts/api-server/scripts/verify-restaurant-prisma-schema.mjs`

## Package commands

```bash
pnpm --filter @workspace/api-server run restaurant:schema:verify
pnpm --filter @workspace/api-server run typecheck:restaurant
```

`typecheck:restaurant` now runs schema mapping verification before Prisma generate and TypeScript.

## Canonical models

| Domain area | Prisma model |
| --- | --- |
| Tenant scope | `Business` |
| Restaurant profile/settings | `Restaurant` |
| Menu category | `Category` |
| Menu item | `MenuItem` |
| Ingredient/packaging inventory | `InventoryItem` |
| Recipe ingredient usage | `Recipe` |
| Dining table | `DiningTable` |
| Order header | `Order` |
| Order lines | `OrderItem` |
| Payment | `Payment` |
| Restaurant stock movement | `StockMovement` |
| Revenue/refund accounting | `CashflowEntry` |
| Audit trail | `AuditLog` |

## Canonical enums

| Domain area | Prisma enum |
| --- | --- |
| Business mode | `BusinessMode` |
| Order workflow | `OrderStatus` |
| Payment workflow | `PaymentStatus` |
| Table workflow | `TableStatus` |
| Stock movement reason | `StockMovementReason` |
| Stock movement source | `StockMovementSource` |
| Cashflow source | `CashflowSourceType` |

## Verification behavior

The verifier reads `prisma/schema.prisma` directly and fails if required Restaurant models, fields, or enum values are missing.

This is intentionally a schema text guard, not a database guard. DB-level baseline/idempotency checks belong to Phase 8G.

## Compatibility notes

Restaurant still has legacy compatibility fields such as:

- `InventoryItem.restaurantId`
- `StockMovement.restaurantId`
- `StockMovement.sourceType`
- `StockMovement.actorId`
- `AuditLog.restaurantId`

New Restaurant-scoped code must use `businessId` as the canonical tenant key. Legacy fields remain only to avoid breaking older F&B routes while migration is still in progress.

## Out of scope

- New migration files.
- Database schema execution.
- Order write workflow.
- Status mutation guards.
- Frontend status actions.
- Deleting old F&B compatibility code.
