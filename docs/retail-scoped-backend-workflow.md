# Retail Mode Scoped Implementation Guide

This document is the working source of truth for Retail Mode only.

Retail Mode is being built while the rest of the backend still has legacy Restaurant/F&B, raw-material, inventory, audit-log, and migration-history issues. Those issues are real, but they are outside this track unless they directly block Retail Mode.

## Retail Phase Tracker

```txt
Phase 1 - Persistence foundation: implemented
Phase 2 - Backend route, guard, and workflow preview: implemented
Phase 3 - Shared dashboard backend summary: implemented
Phase 4 - Seed retail product/supplier per business: implemented
Phase 5 - Frontend catalog and cashier API wiring: implemented
Phase 6 - Retail OpenAPI client coverage: implemented
Phase 7 - Prisma schema delegate cleanup: in progress
  Phase 7A - Schema model mapping: implemented
  Phase 7B - Summary read delegate: implemented
  Phase 7C - Workflow read delegate: planned
  Phase 7D - Checkout preview + cost read delegate: planned
  Phase 7E - Sale + payment + stock movement write delegate: planned
  Phase 7F - Guarded workflow status write delegate: planned
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

Implemented scope:

```txt
- Retail routes are mounted under /api/retail/*
- Retail route handlers are authenticated except health
- Retail route handlers resolve business context
- Retail route handlers verify Retail business mode
- Retail sale preview exists
- Retail mock checkout exists
- Retail real checkout endpoint exists
- Retail return preview exists
```

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

Retail behavior:

```txt
- render relevant Retail dashboard context
- replace generic dashboards that do not fit Retail
- skip payroll/contracts/attendance-heavy pages unless Retail-specific workforce logic exists
- fallback to local Retail mock context if API is unavailable
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

## Phase 7 - Prisma schema delegate cleanup: in progress

Phase 7 is not one big task. It must be split into delegate migration subphases so Retail can move from raw SQL to Prisma delegates without breaking checkout, stock, or payment workflows in one reckless commit.

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

Delegate target after the command succeeds:

```txt
prisma.retailProduct.findMany
prisma.retailProduct.findFirst
prisma.retailProduct.update
prisma.retailSale.create
prisma.retailSaleItem.createMany
prisma.retailPayment.create
prisma.retailStockMovement.create
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

Primary file:

```txt
artifacts/api-server/src/services/retail/retail.prisma-repository.ts
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

Why some raw SQL still exists:

```txt
Phase 7B only covers summary reads. Workflow reads, receiving reads, preview cost reads, checkout writes, and guarded status writes are intentionally left for Phase 7C-7F.
```

Acceptance criteria:

```txt
- GET /api/retail/products still returns the same product DTO shape
- GET /api/retail/inventory/risks still returns the same risk DTO shape
- GET /api/retail/dashboard still works because service summary reads still use the repository seam
- GET /api/retail/shared-dashboard/:dashboardId still works without route/frontend changes
```

### Phase 7C - Workflow read delegate: planned

Goal:

```txt
Convert operational read workflows from raw SQL to Prisma delegates.
```

Target methods:

```txt
findProductById(scope, productId)
findProductByCode(scope, code)
listReceivingQueue(scope)
sale preview product lookup reads
return preview sale/product lookup reads
```

Acceptance criteria:

```txt
- Barcode lookup still resolves by barcode or SKU
- Product detail still remains business-scoped
- Receiving queue still remains business-scoped
- Sale preview still validates inactive/out-of-stock products correctly
```

### Phase 7D - Checkout preview + cost read delegate: planned

Goal:

```txt
Move preview-time product, stock, cost, tax, discount, and gross-profit calculations onto Prisma delegate reads.
```

Target behavior:

```txt
- Preview reads products through prisma.retailProduct
- Preview keeps current DTO contract
- Preview blocks invalid product IDs
- Preview blocks inactive products
- Preview blocks insufficient stock
- Preview calculates subtotal, discount, tax, total, and gross profit consistently with checkout
```

Acceptance criteria:

```txt
- POST /api/retail/sales/preview still returns the same totals and validation reasons
- POST /api/retail/sales/checkout can reuse preview calculations safely
```

### Phase 7E - Sale + payment + stock movement write delegate: planned

Goal:

```txt
Convert real checkout write transaction from raw SQL to Prisma delegate writes.
```

Target writes:

```txt
- prisma.retailSale.create
- prisma.retailSaleItem.createMany
- prisma.retailPayment.create
- prisma.retailProduct.update for stock decrement
- prisma.retailStockMovement.createMany or create
```

Transaction rule:

```txt
Checkout must remain atomic. Do not create sale/payment if stock decrement or stock movement fails.
```

Acceptance criteria:

```txt
- Checkout persists sale, sale items, payment, and stock movement in one Prisma transaction
- Stock after checkout matches previous stock minus sold quantity
- Gross profit remains consistent with preview
- Existing checkout endpoint contract does not change
```

### Phase 7F - Guarded workflow status write delegate: planned

Goal:

```txt
Move status-changing Retail workflows to guarded Prisma delegate writes.
```

Target workflows:

```txt
- receiving status updates when receiving workflow is implemented
- sale status update or cancellation workflow when exposed
- return workflow status update when persistence is implemented
```

Guard rules:

```txt
- Every status update must be business-scoped
- Every status update must validate allowed transitions
- Every stock-affecting status update must write RetailStockMovement
- Every sensitive status update must write AuditLog once audit integration is wired
```

Acceptance criteria:

```txt
- No direct route-level status writes
- Status transition validation lives in service/repository workflow
- Invalid transition returns a typed error instead of silently mutating data
```

Repository migration rule:

```txt
Do not replace every raw query in one pass. Convert read methods first, then checkout write transaction, then guarded status writes.
```

---

## Scope Rule

Retail work must stay inside the Retail boundary first.

```txt
IN SCOPE
- artifacts/api-server/src/routes/retail.ts
- artifacts/api-server/src/services/retail/**
- artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
- artifacts/api-server/scripts/seed-retail-demo-data.ts
- artifacts/api-server/scripts/sync-retail-prisma-schema.ts
- artifacts/pos-system/src/app/workspace/retail/retail-api-workspace.tsx
- artifacts/pos-system/src/features/retail/**
- artifacts/pos-system/src/features/shared/retail-bridge/**
- Retail-specific OpenAPI paths and schemas
- Retail-specific seed/demo workflow
- Retail-specific Prisma schema delegate sync
```

```txt
OUT OF SCOPE FOR THIS TRACK
- raw-material backend cleanup
- legacy misc settings cleanup
- Restaurant/F&B order workflow cleanup
- Restaurant/F&B inventory workflow cleanup
- global audit-log migration cleanup
- full Prisma migration-history repair
```
