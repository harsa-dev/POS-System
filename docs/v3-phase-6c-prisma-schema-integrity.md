# V3 Phase 6C Prisma Schema Integrity Report

## 1. Summary

Phase 6C focused on Prisma/schema integrity and backend/frontend contract drift without adding new business features. The checked-in Prisma schema validates and the Prisma client generates successfully. Backend TypeScript passes after replacing confirmed runtime SQL drift in sales analytics and financial reporting.

No database schema migration was created in this phase. The cleanup fixed code that queried stale `restaurantId` columns on canonical `businessId` tables, and removed live SQL references to a `StockMovement.unitCostSnapshot` column that is not declared in the current Prisma schema.

## 2. Docs Read

- `docs/Prompt-codex.md`
- `docs/v3/migration-plan.md`
- `artifacts/api-server/README.md`
- `artifacts/pos-system/src/features/README.md`

## 3. Prisma Command Results

- `prisma validate --schema prisma/schema.prisma`
  - First direct attempt hit `EPERM: operation not permitted, lstat 'C:\Users\LENOVO'`.
  - Passed after setting workspace-local `TEMP`, `TMP`, and `XDG_CACHE_HOME`.
- `prisma generate --schema prisma/schema.prisma`
  - Passed after setting workspace-local temp/cache paths.
- `prisma migrate status --schema prisma/schema.prisma`
  - Failed after loading the configured Neon datasource.
  - Exact failure: `Error: Schema engine error:`
  - Classification: migration status is blocked by Prisma schema-engine/remote datasource status, not by schema validation.

## 4. Schema Observations

- `Order`, `MenuItem`, `Category`, `Invoice`, and `CashflowEntry` are canonical `businessId` scoped models.
- `InventoryItem`, `StockMovement`, and `AuditLog` still include legacy nullable `restaurantId` fields while migration to `businessId` finishes.
- `StockMovement` does not define `unitCostSnapshot`, `previousStock`, or `newStock` in the current Prisma schema.
- Existing report UI/API DTO names still contain historical `MissingCostSnapshot` keys, but live report SQL now uses linked inventory item cost.

## 5. Backend Fixes

- Sales analytics report queries now filter by `businessId`.
- Sales analytics COGS now uses linked `InventoryItem.costPerUnit` instead of `StockMovement.unitCostSnapshot`.
- Sales payment integrity route now filters orders by `businessId`.
- Financial report summaries and trends now filter by `businessId`.
- Financial reconciliation queries now filter by `businessId`.
- Inventory cost snapshot repair route no longer queries or updates a missing `unitCostSnapshot` column; it reports missing usable inventory item cost instead.

## 6. Frontend Contract/Text Fixes

- Sales analytics UI labels now say `Missing Usable Inventory Cost`.
- Financial reports UI labels now say `Missing Usable Inventory Cost`.
- Inventory cost review panel copy no longer promises a snapshot backfill against a non-schema column.

## 7. Files Changed

- `artifacts/api-server/src/services/sales-analytics/repository.ts`
- `artifacts/api-server/src/services/sales-analytics/reconciliation.ts`
- `artifacts/api-server/src/services/sales-analytics/sales-analytics.service.ts`
- `artifacts/api-server/src/services/sales-analytics/sales-analytics.dto.ts`
- `artifacts/api-server/src/routes/sales-analytics-payment-integrity.ts`
- `artifacts/api-server/src/services/financial-reports/repository.ts`
- `artifacts/api-server/src/services/financial-reports/reconciliation.ts`
- `artifacts/api-server/src/services/financial-reports/report-service.ts`
- `artifacts/api-server/src/services/financial-reports/report-export.ts`
- `artifacts/api-server/src/routes/inventory-cost-snapshot-repairs.ts`
- `artifacts/pos-system/src/features/shared/sales/sales-analytics-dashboard.tsx`
- `artifacts/pos-system/src/features/shared/sales/sales-analytics-reconciliation-drilldown-panel.tsx`
- `artifacts/pos-system/src/features/shared/sales/sales-analytics-synced-reconciliation-drilldown-panel.tsx`
- `artifacts/pos-system/src/features/shared/financial-reports/financial-reports-dashboard.tsx`
- `artifacts/pos-system/src/features/shared/financial-reports/financial-reports-reconciliation-drilldown-panel.tsx`
- `artifacts/pos-system/src/features/shared/inventory/inventory-cost-snapshot-repair-panel.tsx`

## 8. Files Moved/Renamed/Deleted

None in Phase 6C.

## 9. Commands Run

- `cmd /d /c .\node_modules\.bin\tsc.CMD -p tsconfig.json --noEmit --pretty false` from `artifacts/api-server`
  - Passed.
- `prisma validate --schema prisma/schema.prisma`
  - Passed with workspace-local temp/cache.
- `prisma generate --schema prisma/schema.prisma`
  - Passed with workspace-local temp/cache.
- `prisma migrate status --schema prisma/schema.prisma`
  - Failed with `Error: Schema engine error:` after loading the Neon datasource.
- `pnpm --filter @workspace/pos-system run typecheck:restaurant`
  - Blocked by `EPERM: operation not permitted, lstat 'C:\Users\LENOVO'`.
- `tsc -p tsconfig.restaurant.json --noEmit --pretty false`
  - Passed with workspace TypeScript binary.
- `tsc -p tsconfig.retail.json --noEmit --pretty false`
  - Passed with workspace TypeScript binary.
- `tsc -p tsconfig.raw-material.json --noEmit --pretty false`
  - Passed with workspace TypeScript binary.
- `tsc -p tsconfig.service.json --noEmit --pretty false`
  - Passed with workspace TypeScript binary.
- `pnpm --filter @workspace/pos-system run build`
  - Blocked by `EPERM: operation not permitted, lstat 'C:\Users\LENOVO'`.
- Direct Vite fallback
  - Blocked because `vite.CMD` is not linked in the workspace `node_modules/.bin`.
- `node ./scripts/business-mode-switch-check.mjs`
  - Passed: 42 static checks.
- `node ./scripts/restaurant-check.mjs`
  - Blocked at internal `pnpm --filter @workspace/api-server run typecheck:restaurant`.
- `node ./scripts/retail-check.mjs`
  - Blocked at internal `pnpm --filter @workspace/api-server run retail:schema:sync`.
- `node ./scripts/raw-material-check.mjs`
  - Blocked at internal `pnpm --filter @workspace/api-server run generate`.
- `node ./scripts/service-check.mjs`
  - Blocked at internal `pnpm --filter @workspace/api-server run generate`.
- `pnpm typecheck`
  - Blocked by `EPERM: operation not permitted, lstat 'C:\Users\LENOVO'`.
- `tsc --build --pretty false`
  - Passed.
- Full frontend `tsc -p tsconfig.json --noEmit --pretty false`
  - Failed on broad existing registry/shared UI type drift outside the scoped gates.

## 10. Errors Fixed

- Removed live raw SQL references to non-schema `StockMovement.unitCostSnapshot` in sales analytics, financial reports, and inventory cost repair.
- Replaced stale order/menu/category/cashflow/invoice `restaurantId` filters with canonical `businessId` filters where the schema no longer has `restaurantId`.
- Removed unsafe Prisma delegate casts in audited retail repositories.
- Replaced raw-material audit client casting with generated Prisma-compatible typing.

## 11. Business Mode Contract Impact

No business mode IDs or route contracts were changed in Phase 6C. The work preserves the current V3 mode contract:

- Active: `restaurant`, `retail`, `raw-material`
- Planned/guarded: `custom-business`

## 12. API Contract Impact

- Sales analytics and financial reports still expose existing DTO keys for compatibility, including `stockMovementsMissingCostSnapshot`.
- The meaning is now schema-honest: rows missing usable linked inventory cost, not rows missing a non-schema snapshot column.
- Inventory cost repair endpoint no longer pretends to backfill a missing column; it returns no repaired rows and instructs users to update inventory item costs.

## 13. Remaining Risks

- `prisma migrate status` could not complete because Prisma returned a bare schema-engine error after loading the remote Neon datasource.
- Full frontend typecheck still fails in broad registry/shared UI areas that are outside this Phase 6C database contract cleanup.
- Historical DTO names containing `CostSnapshot` remain for compatibility and should be renamed in a future API-versioned cleanup.
- Audit history may still contain `unitCostSnapshot` keys in JSON changes from earlier code paths.

## 14. Manual QA Checklist

- Open sales analytics and confirm report cards load without SQL column errors.
- Open sales analytics reconciliation and confirm missing cost issue copy says usable inventory cost.
- Open financial reports and confirm summaries/trends load without `restaurantId` or `unitCostSnapshot` SQL errors.
- Open financial reconciliation and confirm missing COGS issue copy says usable inventory cost.
- Open inventory cost review and confirm it no longer claims to backfill a snapshot column.
- Confirm Restaurant/Retail/Raw Material mode switching still passes business-mode static checks.

## 15. Next Recommended Task

Fix the remaining full frontend type drift in the registry/shared UI layer so `artifacts/pos-system/tsconfig.json` can pass without relying only on scoped mode gates.
