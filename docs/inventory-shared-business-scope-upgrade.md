# Inventory Shared Business Scope Upgrade

This document records the backend update that wires the new Prisma inventory bridge fields into runtime code.

## Docs checked

- `docs/04-backend-api.md`
- `docs/05-database-storage.md`
- `docs/inventory-backend-workflow.md`
- `docs/inventory-shared-mode-framework.md`

## Completed checklist

1. `inventory.constants.ts` now includes the expanded Prisma inventory enums.
2. `inventory.mode-policy.ts` now gives each business mode its own allowed item types, units, and movement reasons.
3. `createInventoryItem()` now writes `businessId` when a real Business row exists.
4. Opening stock movement now stores business scope, restaurant scope, actor, stock snapshots, unit cost snapshot, source info, and opening stock reason.
5. Manual stock adjustments now store the same movement metadata.
6. `createStockMovement()` now accepts optional source metadata.
7. New stock movement rows now store previous and new stock values.
8. Old inventory items can be backfilled with `businessId`.
9. Old stock movements can be backfilled with business scope, restaurant scope, unit cost snapshot, and system source.
10. `package.json` now exposes the inventory backfill script.

## Backfill command

```powershell
pnpm --filter @workspace/api-server run backfill:inventory-business-scope
```

## Verification commands

```powershell
pnpm --filter @workspace/api-server exec prisma format
pnpm --filter @workspace/api-server exec prisma validate
pnpm --filter @workspace/api-server exec prisma db push
pnpm --filter @workspace/api-server exec prisma generate
pnpm --filter @workspace/api-server run backfill:inventory-business-scope
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
```

## Notes

`businessId` is still optional during the bridge phase. If the business context falls back to the Restaurant id, the service writes `null` instead of writing an invalid Business foreign key.
