# Retail Mode Scoped Implementation Guide

This document is the working source of truth for Retail Mode only.

Retail Mode is being built while the rest of the backend still has legacy Restaurant, raw-material, inventory, audit-log, and migration-history issues. Those issues are real, but they are outside this track unless they directly block Retail Mode.

## Retail Phase Tracker

```txt
Phase 1 - Persistence foundation: implemented
Phase 2 - Backend route, guard, and workflow preview: implemented
Phase 3 - Shared dashboard backend summary: implemented
Phase 4 - Seed retail product/supplier per business: implemented
Phase 5 - Frontend catalog and cashier API wiring: implemented
Phase 6 - Retail OpenAPI client coverage: implemented
Phase 7 - Prisma schema delegate cleanup: implemented
  Phase 7A - Schema model mapping: implemented
  Phase 7B - Summary read delegate: implemented
  Phase 7C - Workflow read delegate: implemented
  Phase 7D - Checkout preview + cost read delegate: implemented
  Phase 7E - Sale + payment + stock movement write delegate: implemented
  Phase 7F - Guarded workflow status write delegate: implemented
```

---

## Phase 1 - Persistence foundation: implemented

Implemented scope:

```txt
- Retail SQL persistence migration exists
- RetailSupplier table exists in SQL migration
- RetailProduct table exists in SQL migration
- RetailReceiving and RetailReceivingItem tables exist in SQL migration
- RetailSale, RetailSaleItem, RetailPayment, and RetailStockMovement tables exist in SQL migration
- Retail repository provider seam exists
- Retail Prisma-backed repository exists
```

Primary files:

```txt
artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
artifacts/api-server/src/services/retail/retail.repository.ts
artifacts/api-server/src/services/retail/retail.repository-provider.ts
artifacts/api-server/src/services/retail/retail.prisma-repository.ts
```

Validation command:

```bash
pnpm --filter @workspace/api-server run retail:db:apply
```

Do not use full `prisma migrate dev` or `prisma migrate deploy` for this Retail track yet. Full migration replay can fail on older non-retail migration history before Retail tables are even tested.

---

## Phase 2 - Backend route, guard, and workflow preview: implemented

Implemented endpoints:

```txt
GET  /api/retail/health
GET  /api/retail/dashboard
GET  /api/retail/products
GET  /api/retail/products/:id
GET  /api/retail/barcode/:code
GET  /api/retail/inventory/risks
GET  /api/retail/receiving
GET  /api/retail/command-center
GET  /api/retail/shared-dashboard/:dashboardId
POST /api/retail/sales/preview
POST /api/retail/sales/mock-checkout
POST /api/retail/sales/checkout
POST /api/retail/returns/preview
```

Real checkout rule:

```txt
A successful Retail checkout must remain one transaction:
1. RetailSale
2. RetailSaleItem
3. RetailPayment
4. RetailProduct stock decrement
5. RetailStockMovement
6. CashflowEntry
7. AuditLog
```

Never update Retail stock directly from a route handler. Stock mutations belong in the Retail repository/service workflow.

---

## Phase 3 - Shared dashboard backend summary: implemented

Implemented scope:

```txt
- Retail shared dashboard endpoint exists
- Retail dashboard IDs are typed in backend DTOs
- Shared dashboard bridge can prefer backend API data
- Shared dashboard bridge can fallback to local mock data during dev
```

Primary endpoint:

```txt
GET /api/retail/shared-dashboard/:dashboardId
```

---

## Phase 4 - Seed retail product/supplier per business: implemented

Implemented scope:

```txt
- Retail seed script exists
- Retail seed command exists
- Seed resolves active Business rows where mode = RETAIL
- Seed upserts RetailSupplier demo rows per Retail business
- Seed upserts RetailProduct demo rows per Retail business
- Seed keeps in-stock, low-stock, and out-of-stock examples available for testing
- Seed is idempotent and safe to run more than once
```

Primary files:

```txt
artifacts/api-server/scripts/seed-retail-demo-data.ts
artifacts/api-server/package.json
```

Command:

```bash
pnpm --filter @workspace/api-server run retail:seed
```

Expected result:

```txt
GET /api/retail/products returns seeded rows for the active Retail business.
GET /api/retail/barcode/8991001000011 can resolve the demo chips product.
GET /api/retail/shared-dashboard/inventory has inventory context instead of an empty Retail database.
```

---

## Phase 5 - Frontend catalog and cashier API wiring: implemented

Implemented scope:

```txt
- Retail API-backed workspace exists for cashier and catalog
- Retail catalog calls GET /api/retail/products first
- Retail cashier calls GET /api/retail/products for scanner/cart product data
- Retail cashier posts persisted checkout to POST /api/retail/sales/checkout
- Frontend requests include credentials so auth cookies are sent
- UI falls back to local mock products if backend is offline, unauthorized, or empty during dev
- UI shows source state: Prisma API / Loading API / Mock fallback
- /v3/retail/cashier and /v3/retail/catalog routes use the API-backed workspace
```

Primary files:

```txt
artifacts/pos-system/src/app/workspace/retail/retail-api-workspace.tsx
artifacts/pos-system/src/App.tsx
```

---

## Phase 6 - Retail OpenAPI client coverage: implemented

Implemented scope:

```txt
- Retail paths were added to lib/api-spec/openapi.yaml for the first client-covered surfaces
- Generated React client schemas include Retail product, checkout, dashboard, barcode, inventory risk, receiving, and shared dashboard DTOs
- Generated React client functions expose core Retail endpoints
- Existing frontend raw fetch bridges can be replaced incrementally by @workspace/api-client-react exports
```

Primary files:

```txt
lib/api-spec/openapi.yaml
lib/api-client-react/src/generated/api.ts
lib/api-client-react/src/generated/api.schemas.ts
```

Generated React client exports:

```txt
retailGetDashboard
retailListProducts
retailLookupBarcode
retailGetInventoryRisks
retailGetReceivingQueue
retailGetSharedDashboard
retailPreviewSale
retailCheckoutSale
useRetailListProducts
useRetailGetSharedDashboard
useRetailCheckoutSale
```

Current note:

```txt
The React client surface is implemented. Full Orval regeneration should still be run locally with pnpm --filter @workspace/api-spec codegen when the generator environment is stable, because the project keeps generated artifacts in git.
```

---

## Phase 7 - Prisma schema delegate cleanup: implemented

Phase 7 is split into delegate migration subphases so Retail can move from raw SQL to Prisma delegates without breaking checkout, stock, or payment workflows in one reckless commit.

### Phase 7A - Schema model mapping: implemented

Implemented scope:

```txt
- Retail Prisma schema sync script exists
- Retail schema sync command exists
- Script inserts Retail relations into User and Business models idempotently
- Script inserts RetailSupplier, RetailProduct, RetailReceiving, RetailReceivingItem, RetailSale, RetailSaleItem, RetailPayment, and RetailStockMovement models idempotently
- Existing raw SQL repository remains active until generated delegates are validated locally
```

Primary files:

```txt
artifacts/api-server/scripts/sync-retail-prisma-schema.ts
artifacts/api-server/package.json
artifacts/api-server/prisma/schema.prisma
```

Command:

```bash
pnpm --filter @workspace/api-server run retail:schema:sync
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run typecheck:retail
```

### Phase 7B - Summary read delegate: implemented

Implemented scope:

```txt
- Retail summary product listing now reads through prisma.retailProduct.findMany
- Retail supplier listing now reads through prisma.retailSupplier.findMany
- Retail inventory risk summary now reads through prisma.retailProduct.findMany
- Summary DTO shapes remain unchanged
- No route changes are required
- No frontend changes are required
```

Converted repository methods:

```txt
listProducts(scope)
listSuppliers(scope)
getInventoryRisks(scope)
```

Delegate behavior:

```txt
- listProducts maps Prisma decimal values into number DTO fields
- listProducts derives stock status in application code: in-stock, low-stock, out-of-stock
- getInventoryRisks filters products where currentStock <= reorderPoint in application code
- getInventoryRisks derives suggestedOrderQty and estimatedCost in application code
```

### Phase 7C - Workflow read delegate: implemented

Implemented scope:

```txt
- Retail product detail reads now use prisma.retailProduct.findFirst
- Retail barcode/SKU lookup now uses prisma.retailProduct.findFirst
- Retail receiving queue reads now use prisma.retailReceiving.findMany with supplier and product item selects
- Product DTO shape remains unchanged
- Receiving queue DTO shape remains unchanged
- No route changes are required
- No frontend changes are required
- Checkout write transaction is intentionally still raw SQL until Phase 7E
```

Converted repository methods:

```txt
findProductById(scope, productId)
findProductByCode(scope, code)
listReceivingQueue(scope)
```

Acceptance criteria:

```txt
- GET /api/retail/products/:id still returns the same product DTO shape
- GET /api/retail/barcode/:code still resolves by barcode or SKU
- GET /api/retail/receiving still returns the same receiving queue DTO shape
- POST /api/retail/sales/preview can still reuse repository product reads without route changes
```

### Phase 7D - Checkout preview + cost read delegate: implemented

Implemented scope:

```txt
- Retail checkout preview batch-loads active products through the delegate-backed product listing
- Preview no longer loops one product detail read per sale line
- Preview still blocks invalid product IDs
- Preview still blocks inactive products because the delegate-backed product listing is active-product scoped
- Preview still blocks insufficient stock
- Preview keeps the same DTO contract for preview, mock checkout, and real checkout preflight
- Preview calculates subtotal, discount, tax included, payable total, and gross profit before write transaction
```

Converted service behavior:

```txt
previewSale(scope, input)
```

Acceptance criteria:

```txt
- POST /api/retail/sales/preview still returns the same totals and validation reasons
- POST /api/retail/sales/mock-checkout still reuses preview without DB writes
- POST /api/retail/sales/checkout can reuse preview calculations safely before the Phase 7E write transaction
```

### Phase 7E - Sale + payment + stock movement write delegate: implemented

Implemented scope:

```txt
- Retail real checkout creates RetailSale through prisma.retailSale.create
- Retail real checkout creates RetailSaleItem rows through prisma.retailSaleItem.createMany
- Retail real checkout creates RetailPayment through prisma.retailPayment.create
- Retail real checkout decrements product stock through prisma.retailProduct.updateMany
- Retail real checkout creates RetailStockMovement rows through prisma.retailStockMovement.create
- Checkout remains one Prisma transaction with serializable isolation
- Existing checkout endpoint contract does not change
- CashflowEntry and AuditLog are still written inside the same transaction with raw SQL until non-Retail delegate/audit hardening is handled
```

Converted repository method:

```txt
createSale(input)
```

Acceptance criteria:

```txt
- POST /api/retail/sales/checkout still returns the same persisted checkout DTO shape
- RetailSale, RetailSaleItem, RetailPayment, RetailProduct stock decrement, and RetailStockMovement are committed atomically
- CashflowEntry and AuditLog are still created in the same transaction
- Stock cannot go negative from checkout
- Existing frontend cashier flow does not change
```

### Phase 7F - Guarded workflow status write delegate: implemented

Implemented scope:

```txt
- Guarded Retail receiving status write helper exists
- Helper uses prisma.retailReceiving.findFirst for business-scoped target lookup
- Helper validates allowed receiving status transitions before mutation
- Helper uses prisma.retailReceiving.updateMany with businessId + id + previous status guard
- Helper writes AuditLog in the same transaction
- Helper uses serializable isolation
- No public route is exposed yet because receiving mutation UI, sale cancellation, return persistence, payment reversal, and stock-affecting status workflows still need product/finance rules before exposure
```

Primary file:

```txt
artifacts/api-server/src/services/retail/retail.workflow-status.repository.ts
```

Implemented helper:

```txt
updateRetailReceivingStatusWithDelegate(input)
```

Allowed receiving transitions:

```txt
draft -> ordered
ordered -> partial
ordered -> received
partial -> received
received -> final
```

Guard rules:

```txt
- Every update is business-scoped
- Every update is guarded by previous status
- Invalid transitions return a rejected result instead of mutating rows
- Concurrent status changes fail through updateMany count guard
- AuditLog is written at the same transaction callsite
```

Current boundary:

```txt
Sale cancellation/refund and return workflow status writes are intentionally not exposed in this phase. Those paths are stock/finance-affecting and need payment/cashflow reversal rules before a public route is safe.
```

Acceptance criteria:

```txt
- Receiving status update helper does not allow cross-business updates
- Invalid receiving transitions are rejected before mutation
- Audit/event hook has a clear callsite
- Status update remains atomic
```

---

## Scoped validation commands

Use these commands for Retail work:

```bash
pnpm --filter @workspace/api-server run retail:db:apply
pnpm --filter @workspace/api-server run retail:seed
pnpm --filter @workspace/api-server run retail:schema:sync
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run typecheck:retail
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-spec codegen
```

Full backend `typecheck` can still fail on legacy non-retail files. That does not automatically block Retail unless the changed file is in this scoped track.

## Retail smoke test order

```txt
GET  /api/retail/health
GET  /api/retail/products
GET  /api/retail/dashboard
GET  /api/retail/shared-dashboard/inventory
POST /api/retail/sales/preview
POST /api/retail/sales/checkout
```
